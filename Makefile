build:
	docker build --platform linux/amd64 -t canvas-saver-back .
run:
	docker run -it -d -p 1337:1337 --name canvas-saver-back canvas-saver-back
