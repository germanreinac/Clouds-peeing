# Clouds Peeing

A sky screensaver with a questionable game hidden inside. Plain HTML + canvas, no build step.

## Run

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## What's in it

- **Sky (home)** – drifting clouds; the menu fades after a few seconds of no input, so it works as a screensaver. `F` toggles fullscreen.
- **Customize** – cloud style (puffy / wispy / stormy / pixel), sky (day / dawn / sunset / night), mode (pee / rain / dry), amount, wind, faces. Saved in the browser.
- **Play** – pick a scene (Funeral, Beer Garden, Wedding), choose a target, then soak everyone within 45 seconds. Move to aim, hold click / touch / space to let go, hover over water (pond, kegs, fountain) to refill. Target is worth 500, everyone else 100, plus a speed bonus for a total washout.

## As a Chrome new-tab page

`chrome://extensions` → enable Developer mode → **Load unpacked** → select this folder.

## Layout

- `js/clouds.js` – settings, sky themes, cloud shapes and drawing
- `js/screensaver.js` – home sky
- `js/game.js` – isometric game; scenes are plain data in `SCENES` at the top
- `js/main.js` – menus, HUD, input, main loop
