const MAX_BODY_BYTES = 4096;
const MAX_QUESTION_CHARACTERS = 500;
const DEFAULT_FIRST_BYTE_TIMEOUT_MS = 30_000;
const DEFAULT_COMPLETE_TIMEOUT_MS = 90_000;

const jsonHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
};

function errorResponse(status, code, message, requestId) {
  return new Response(JSON.stringify({ error: { code, message }, requestId }), {
    status,
    headers: jsonHeaders,
  });
}

function requireEnvironment(env) {
  const required = [
    'PUBLIC_ASK_ORIGIN_URL',
    'CF_ACCESS_CLIENT_ID',
    'CF_ACCESS_CLIENT_SECRET',
    'PUBLIC_ASK_RELAY_SECRET',
  ];
  for (const name of required) {
    if (typeof env?.[name] !== 'string' || env[name].length === 0) return name;
  }
  return null;
}

function requestIdentity(request) {
  const edgeContext = request.eo;
  return {
    clientIp: typeof edgeContext?.clientIp === 'string' ? edgeContext.clientIp : '',
    requestId:
      typeof edgeContext?.uuid === 'string' && edgeContext.uuid.length > 0
        ? edgeContext.uuid
        : crypto.randomUUID(),
  };
}

async function parseQuestion(request) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { error: [415, 'unsupported_media_type', '请求必须使用 application/json。'] };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { error: [400, 'invalid_request', '请求体过大。'] };
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { error: [400, 'invalid_json', '请求体不是有效 JSON。'] };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: [400, 'invalid_request', '请求体必须是 JSON 对象。'] };
  }
  if (Object.keys(body).length !== 1 || !Object.hasOwn(body, 'question')) {
    return { error: [400, 'invalid_request', '请求体只允许 question 字段。'] };
  }
  if (typeof body.question !== 'string') {
    return { error: [400, 'invalid_question', 'question 必须是字符串。'] };
  }

  const question = body.question.trim().normalize('NFC');
  const length = Array.from(question).length;
  if (length < 1 || length > MAX_QUESTION_CHARACTERS) {
    return { error: [400, 'invalid_question', '问题长度必须在 1 到 500 个字符之间。'] };
  }
  return { question };
}

function mapUpstreamStatus(status) {
  if (status === 429 || status === 402) {
    return [429, 'capacity_limited', '公开问答当前已达到使用上限，请稍后再试。'];
  }
  if (status === 504 || status === 408) {
    return [504, 'upstream_timeout', '回答超时，请稍后重试。'];
  }
  return [502, 'upstream_unavailable', '公开问答服务暂时不可用。'];
}

async function readFirstChunk(reader, abortController, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      reader.read(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          abortController.abort(new Error('first-byte-timeout'));
          reject(new Error('first-byte-timeout'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function streamFromReader(firstChunk, reader, abortController, completeTimeoutMs, cleanup) {
  let finished = false;
  const timer = setTimeout(() => abortController.abort(new Error('complete-timeout')), completeTimeoutMs);

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    cleanup();
  };

  return new ReadableStream({
    start(controller) {
      if (firstChunk.done) {
        finish();
        controller.close();
      } else {
        controller.enqueue(firstChunk.value);
      }
    },
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          finish();
          controller.close();
        } else {
          controller.enqueue(chunk.value);
        }
      } catch (error) {
        finish();
        controller.error(error);
      }
    },
    async cancel(reason) {
      finish();
      abortController.abort(reason);
      await reader.cancel(reason).catch(() => {});
    },
  });
}

export function createAskHandler({
  fetchImpl = fetch,
  firstByteTimeoutMs = DEFAULT_FIRST_BYTE_TIMEOUT_MS,
  completeTimeoutMs = DEFAULT_COMPLETE_TIMEOUT_MS,
} = {}) {
  return async function handleAsk(context) {
    const { request, env } = context;
    const { clientIp, requestId } = requestIdentity(request);

    if (request.method !== 'POST') {
      const response = errorResponse(405, 'method_not_allowed', '只允许 POST 请求。', requestId);
      response.headers.set('allow', 'POST');
      return response;
    }

    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) {
      return errorResponse(403, 'origin_denied', '不允许跨站调用。', requestId);
    }

    const missingEnvironment = requireEnvironment(env);
    if (missingEnvironment) {
      console.error(JSON.stringify({ event: 'public_ask_config_error', requestId, missingEnvironment }));
      return errorResponse(503, 'service_unconfigured', '公开问答服务尚未完成配置。', requestId);
    }
    if (!clientIp) {
      console.error(JSON.stringify({ event: 'public_ask_edge_context_missing', requestId }));
      return errorResponse(502, 'edge_context_unavailable', '无法确认请求来源。', requestId);
    }

    const parsed = await parseQuestion(request);
    if (parsed.error) return errorResponse(...parsed.error, requestId);

    const abortController = new AbortController();
    const abortFromClient = () => abortController.abort(request.signal.reason);
    request.signal?.addEventListener('abort', abortFromClient, { once: true });
    const cleanup = () => request.signal?.removeEventListener('abort', abortFromClient);

    let upstream;
    try {
      upstream = await fetchImpl(env.PUBLIC_ASK_ORIGIN_URL, {
        method: 'POST',
        headers: {
          accept: 'text/event-stream',
          'content-type': 'application/json',
          'cf-access-client-id': env.CF_ACCESS_CLIENT_ID,
          'cf-access-client-secret': env.CF_ACCESS_CLIENT_SECRET,
          'x-public-ask-client-ip': clientIp,
          'x-public-ask-request-id': requestId,
          'x-public-ask-token': env.PUBLIC_ASK_RELAY_SECRET,
        },
        body: JSON.stringify({ question: parsed.question }),
        redirect: 'error',
        signal: abortController.signal,
      });
    } catch {
      cleanup();
      return errorResponse(502, 'upstream_unavailable', '公开问答服务暂时不可用。', requestId);
    }

    if (!upstream.ok) {
      cleanup();
      upstream.body?.cancel().catch(() => {});
      return errorResponse(...mapUpstreamStatus(upstream.status), requestId);
    }
    if (!upstream.headers.get('content-type')?.toLowerCase().includes('text/event-stream') || !upstream.body) {
      cleanup();
      upstream.body?.cancel().catch(() => {});
      return errorResponse(502, 'invalid_upstream_response', '公开问答服务返回了无效响应。', requestId);
    }

    const reader = upstream.body.getReader();
    let firstChunk;
    try {
      firstChunk = await readFirstChunk(reader, abortController, firstByteTimeoutMs);
    } catch {
      cleanup();
      await reader.cancel().catch(() => {});
      return errorResponse(504, 'first_byte_timeout', '回答生成超时，请稍后重试。', requestId);
    }

    return new Response(
      streamFromReader(firstChunk, reader, abortController, completeTimeoutMs, cleanup),
      {
        status: 200,
        headers: {
          'cache-control': 'no-store, no-transform',
          'content-type': 'text/event-stream; charset=utf-8',
          'x-content-type-options': 'nosniff',
          'x-request-id': requestId,
        },
      },
    );
  };
}

export const onRequest = createAskHandler();
