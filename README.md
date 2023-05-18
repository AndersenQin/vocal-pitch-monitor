<p align="center">
  <img src="https://user-images.githubusercontent.com/93479191/222909867-15a5adbd-940e-42ca-bc2f-bead5dd700a9.gif">
  <br>
  <em>A simple pitch monitor that calculates and displays the pitch of microphone input using autocorrelation</em>
</p>

deploy
```
git clone ptoject

docker run -it --rm --net=host -v ./vocal-pitch-monitor:/app node:alpine sh

cd app

npm i

npm run dev
```



