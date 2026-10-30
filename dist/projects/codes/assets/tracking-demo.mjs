export function loadDecodedImage(src, ImageClass = Image) {
	return new Promise((resolve, reject) => {
		const image = new ImageClass();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('图片加载失败，请使用本地图片或允许跨域访问的图片。'));
		image.src = src;
	});
}

export function sourceFaceRect(rect, natural, detected) {
	if (![rect.x, rect.y, rect.width, rect.height, natural.width, natural.height, detected.width, detected.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0 || detected.width <= 0 || detected.height <= 0) return null;
	const scaleX = natural.width / detected.width, scaleY = natural.height / detected.height;
	const x = Math.max(0, Math.floor(rect.x * scaleX)), y = Math.max(0, Math.floor(rect.y * scaleY));
	const right = Math.min(natural.width, Math.ceil((rect.x + rect.width) * scaleX));
	const bottom = Math.min(natural.height, Math.ceil((rect.y + rect.height) * scaleY));
	return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : null;
}

export function initTrackingDemo() {
	const byId = (id) => document.getElementById(id);
	const img = byId('img'), main = byId('main'), canvas = byId('myCanvas');
	const context = canvas.getContext('2d');
	const status = byId('trackingStatus'), trackButton = byId('track');
	const gallery = document.querySelector('.demo'), fileInput = byId('file');
	const step = byId('myStepSize'), scale = byId('myScaleFactor');
	const composeButtons = [...document.querySelectorAll('.compound')];
	let version = 0, source = null, firstFace = null, busy = false, reader = null;
	const setStatus = (message, state) => { status.textContent = message; status.dataset.state = state; };
	const updateButtons = () => {
		trackButton.disabled = busy || !source;
		for (const button of composeButtons) {
			button.disabled = busy || !firstFace;
			button.classList.toggle('hide', !firstFace);
		}
	};
	const clearResults = () => {
		firstFace = null;
		main.querySelectorAll('.rect').forEach((rect) => rect.remove());
		context.clearRect(0, 0, canvas.width, canvas.height);
		gallery.classList.add('hide');
	};
	const reset = () => {
		version++;
		if (reader?.readyState === 1) reader.abort();
		source = null; busy = false;
		img.removeAttribute('src'); fileInput.value = '';
		clearResults(); updateButtons();
		setStatus('请选择示例图片、上传图片或输入图片网址。', 'empty');
	};
	const showSettings = () => {
		byId('stepValue').value = Number(step.value).toFixed(1);
		byId('scaleValue').value = Number(scale.value).toFixed(1);
	};
	step.addEventListener('input', showSettings); scale.addEventListener('input', showSettings);
	showSettings(); reset();
	if (!window.tracking || !window.AlloyImage) {
		setStatus('检测组件未能加载，请刷新后重试。', 'error');
		return;
	}

	async function loadSource(url, token = ++version) {
		clearResults(); source = null; busy = true;
		img.removeAttribute('src'); updateButtons();
		setStatus('图片加载中…', 'loading');
		try {
			const decoded = await loadDecodedImage(url);
			if (token !== version) return;
			img.src = decoded.src;
			await img.decode();
			if (token !== version) return;
			source = decoded;
			setStatus('图片已加载，可以开始识别。', 'ready');
		} catch (error) {
			if (token === version) { img.removeAttribute('src'); setStatus(error.message, 'error'); }
		} finally {
			if (token === version) { busy = false; updateButtons(); }
		}
	}
	byId('toggleDemo').addEventListener('click', () => gallery.classList.toggle('hide'));
	for (const item of gallery.querySelectorAll('[data-src]')) item.style.backgroundImage = `url("${item.dataset.src}")`;
	gallery.addEventListener('click', (event) => {
		const item = event.target.closest('[data-src]');
		if (!item || !gallery.contains(item)) return;
		step.value = item.dataset.stepsize; scale.value = item.dataset.trackmode; showSettings();
		fileInput.value = '';
		void loadSource(item.dataset.src);
	});
	fileInput.addEventListener('change', () => {
		const file = fileInput.files[0];
		if (!file) return;
		reset();
		if (!['image/png', 'image/jpeg'].includes(file.type)) { setStatus('仅支持 PNG 和 JPEG 图片。', 'error'); return; }
		const token = version;
		busy = true; updateButtons(); setStatus('图片加载中…', 'loading');
		reader = new FileReader();
		reader.onload = () => { if (token === version) void loadSource(reader.result, token); };
		reader.onerror = () => { if (token === version) { busy = false; updateButtons(); setStatus('读取图片失败，请重新选择。', 'error'); } };
		reader.readAsDataURL(file);
	});
	byId('loadRemote').addEventListener('click', () => {
		const value = byId('remoteImg').value.trim();
		try {
			const url = new URL(value, location.href);
			if (!value || !['http:', 'https:'].includes(url.protocol)) throw new Error('请输入 HTTP 或 HTTPS 图片网址。');
			fileInput.value = '';
			void loadSource(url.href);
		} catch { reset(); setStatus('请输入 HTTP 或 HTTPS 图片网址。', 'error'); }
	});
	byId('reset').addEventListener('click', reset);

	const tracker = new tracking.ObjectTracker(['face']);
	let detections = [];
	tracker.on('track', (event) => { detections = event.data; });
	trackButton.addEventListener('click', async () => {
		if (!source || busy) return;
		const token = version;
		clearResults(); busy = true; updateButtons(); setStatus('正在识别…', 'detecting');
		await new Promise(requestAnimationFrame);
		if (token !== version) return;
		try {
			const width = Math.max(1, Math.round(img.getBoundingClientRect().width));
			const height = Math.max(1, Math.round(width * source.naturalHeight / source.naturalWidth));
			const detection = document.createElement('canvas');
			detection.width = width; detection.height = height;
			const ctx = detection.getContext('2d');
			ctx.drawImage(source, 0, 0, width, height);
			tracker.setStepSize(Number(step.value)); tracker.setScaleFactor(Number(scale.value));
			detections = [];
			tracker.track(ctx.getImageData(0, 0, width, height).data, width, height);
			const faces = detections.map((rect) => ({ rect, crop: sourceFaceRect(rect, { width: source.naturalWidth, height: source.naturalHeight }, { width, height }) })).filter(({ crop }) => crop);
			if (!faces.length) { setStatus('画面中没有检测到人脸，请换图或调整参数重试。', 'no-face'); return; }
			firstFace = faces[0].crop;
			const tile = 160, gap = 10, columns = Math.max(1, Math.floor(canvas.parentElement.clientWidth / (tile + gap)));
			canvas.width = columns * (tile + gap); canvas.height = Math.ceil(faces.length / columns) * (tile + gap);
			faces.forEach(({ rect, crop }, i) => {
				const outline = document.createElement('div'); outline.className = 'rect';
				Object.assign(outline.style, { position: 'absolute', left: `${img.offsetLeft + rect.x}px`, top: `${img.offsetTop + rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
				main.append(outline);
				context.drawImage(source, crop.x, crop.y, crop.width, crop.height, (i % columns) * (tile + gap), Math.floor(i / columns) * (tile + gap), tile, tile);
			});
			setStatus(`识别成功，检测到 ${faces.length} 张人脸。`, 'detected');
		} catch { clearResults(); setStatus('图片无法读取，请使用本地图片或允许跨域访问的图片。', 'error'); }
		finally { if (token === version) { busy = false; updateButtons(); } }
	});

	for (const button of composeButtons) button.addEventListener('click', async () => {
		if (!firstFace || busy) return;
		const token = version, crop = firstFace, original = source;
		busy = true; updateButtons(); setStatus('正在合成…', 'composing');
		try {
			const male = button.classList.contains('male');
			const background = await loadDecodedImage(byId(male ? 'maleBg' : 'femaleBg').src);
			if (token !== version) return;
			const face = document.createElement('canvas'); face.width = crop.width; face.height = crop.height;
			face.getContext('2d').drawImage(original, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
			const tone = AlloyImage(face).act('灰度处理').add(AlloyImage(crop.width, crop.height, '#808080').act('高斯模糊', 4).act('色相/饱和度调节', male ? 22 : 28, male ? 45 : 55, 0, true), '叠加');
			const processed = await loadDecodedImage(tone.save());
			if (token !== version) return;
			canvas.width = 400; canvas.height = 480;
			if (male) context.drawImage(processed, 95, 100, 186, 186);
			else context.drawImage(processed, 117, 74, 194, 194);
			context.drawImage(background, 0, 0);
			setStatus(`已完成${male ? '男' : '女'}军装照合成。`, 'composed');
		} catch { if (token === version) setStatus('合成失败，请重新选择图片后再试。', 'error'); }
		finally { if (token === version) { busy = false; updateButtons(); } }
	});
}

if (typeof document !== 'undefined') initTrackingDemo();
