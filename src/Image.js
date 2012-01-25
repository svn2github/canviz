var CanvizImage = Class.create({
	initialize: function(canviz, src) {
		this.canviz = canviz;
		++this.canviz.numImages;
		this.finished = this.loaded = false;
		this.img = new Image();
		this.img.onload = this.onLoad.bind(this);
		this.img.onerror = this.onFinish.bind(this);
		this.img.onabort = this.onFinish.bind(this);
		this.img.src = this.canviz.imagePath + src;
	},
	onLoad: function() {
		this.loaded = true;
		this.onFinish();
	},
	onFinish: function() {
		this.finished = true;
		++this.canviz.numImagesFinished;
		if (this.canviz.numImages == this.canviz.numImagesFinished) {
			this.canviz.draw(true);
		}
	},
	draw: function(ctx, l, t, w, h) {
		if (this.finished) {
			if (this.loaded) {
				ctx.drawImage(this.img, l, t, w, h);
			} else {
				debug('can\'t load image ' + this.img.src);
				this.drawBrokenImage(ctx, l, t, w, h);
			}
		}
	},
	drawBrokenImage: function(ctx, l, t, w, h) {
		ctx.save();
		ctx.beginPath();
		new Rect(l, t, l + w, t + w).draw(ctx);
		ctx.moveTo(l, t);
		ctx.lineTo(l + w, t + w);
		ctx.moveTo(l + w, t);
		ctx.lineTo(l, t + h);
		ctx.strokeStyle = '#f00';
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.restore();
	}
});
