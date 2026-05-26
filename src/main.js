import {
  Application,
  Assets,
  BlurFilter,
  Container,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#f8d1e4ff", width: 920, height: 800 });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Register Spine assets
  Assets.add({ alias: "female_skeleton", src: "/Symbol/Female_Special.json" });
  Assets.add({ alias: "female_atlas", src: "/Symbol/Female_Special.atlas" });
  Assets.add({ alias: "male_skeleton", src: "/Symbol/Male_Special.json" });
  Assets.add({ alias: "male_atlas", src: "/Symbol/Male_Special.atlas" });
  Assets.add({ alias: "sombrero_skeleton", src: "/Symbol/Sombrero.json" });
  Assets.add({ alias: "sombrero_atlas", src: "/Symbol/Sombrero.atlas" });

  // Load the textures
  await Assets.load([
    "/AA/Maracas.png",
    "/AA/Wild.png",
    "/AA/Board.png",
    "/AA/Atest.png",
    "/AA/play_button.png",
    "female_skeleton",
    "female_atlas",
    "male_skeleton",
    "male_atlas",
    "sombrero_skeleton",
    "sombrero_atlas",
  ]);

  const BOARD_ORIG_WIDTH = 1908;
  const BOARD_ORIG_HEIGHT = 1566;

  const BOARD_DISPLAY_WIDTH = 700;
  const BOARD_DISPLAY_HEIGHT = 700;

  const scaleX = BOARD_DISPLAY_WIDTH / BOARD_ORIG_WIDTH;
  const scaleY = BOARD_DISPLAY_HEIGHT / BOARD_ORIG_HEIGHT;

  // Grid coordinates relative to original Atest.png (1908x1566).
  // Keep the reel mask inside the gold frame so symbols do not overlap the board.
  const GRID_ORIG_X = 205;
  const GRID_ORIG_Y = 210;
  const GRID_ORIG_WIDTH = 1510;
  const GRID_ORIG_HEIGHT = 1190;
  const SYMBOL_TRACK_ORIG_HEIGHT = 1210;

  // Scaled coordinates on screen
  const GRID_X = GRID_ORIG_X * scaleX;
  const GRID_Y = GRID_ORIG_Y * scaleY;
  const GRID_WIDTH = GRID_ORIG_WIDTH * scaleX;
  const GRID_HEIGHT = GRID_ORIG_HEIGHT * scaleY;
  const SYMBOL_TRACK_HEIGHT = SYMBOL_TRACK_ORIG_HEIGHT * scaleY;

  const REEL_COUNT = 5;
  const ROW_COUNT = 4;
  const SYMBOLS_PER_REEL = ROW_COUNT + 1;

  // Dimensions of each cell in the 5x4 grid
  const REEL_WIDTH = GRID_WIDTH / REEL_COUNT;
  const SYMBOL_SIZE = SYMBOL_TRACK_HEIGHT / ROW_COUNT;

  // Create different slot symbols (mix of textures and spine string IDs)
  const symbolTypes = [
    Texture.from("/AA/Maracas.png"),
    Texture.from("/AA/Wild.png"),
    "female",
    "male",
    "sombrero",
  ];

  function setupSymbolLayout(symbolContainer, isSpine, displayObject) {
    let origWidth, origHeight;
    if (isSpine) {
      origWidth = displayObject.skeleton.data.width;
      origHeight = displayObject.skeleton.data.height;
    } else {
      origWidth = displayObject.texture.width;
      origHeight = displayObject.texture.height;
    }

    const scale = Math.min(
      REEL_WIDTH / origWidth,
      SYMBOL_SIZE / origHeight,
    ) * 0.85;

    displayObject.scale.set(scale);

    if (isSpine) {
      displayObject.x = REEL_WIDTH / 2 - 6;
      displayObject.y = SYMBOL_SIZE / 2 - 6;
    } else {
      displayObject.x = Math.round((REEL_WIDTH - displayObject.width) / 2) - 6;
      displayObject.y = Math.round((SYMBOL_SIZE - displayObject.height) / 2) - 6;
    }
  }

  function setSymbolType(symbolContainer, newType) {
    // Remove old child if any
    if (symbolContainer.children.length > 0) {
      const oldChild = symbolContainer.removeChildAt(0);
      oldChild.destroy({ children: true });
    }

    symbolContainer.symbolType = newType;
    let displayObject;
    let isSpine = false;

    if (newType === "female" || newType === "male" || newType === "sombrero") {
      isSpine = true;
      let skeleton, atlas, defaultAnim;
      if (newType === "female") {
        skeleton = "female_skeleton";
        atlas = "female_atlas";
        defaultAnim = "idle";
      } else if (newType === "male") {
        skeleton = "male_skeleton";
        atlas = "male_atlas";
        defaultAnim = "idle";
      } else {
        skeleton = "sombrero_skeleton";
        atlas = "sombrero_atlas";
        defaultAnim = "default";
      }

      displayObject = Spine.from({
        skeleton: skeleton,
        atlas: atlas
      });

      displayObject.state.setAnimation(0, defaultAnim, true);
    } else {
      displayObject = new Sprite(newType);
    }

    symbolContainer.addChild(displayObject);
    symbolContainer.displayObject = displayObject;
    symbolContainer.isSpine = isSpine;

    setupSymbolLayout(symbolContainer, isSpine, displayObject);
  }

  // Build the reels
  const reels = [];
  const reelContainer = new Container();

  for (let i = 0; i < REEL_COUNT; i++) {
    const rc = new Container();

    rc.x = i * REEL_WIDTH;
    reelContainer.addChild(rc);

    const reel = {
      container: rc,
      symbols: [],
      position: 0,
      previousPosition: 0,
      blur: new BlurFilter(),
    };
    reel.blur.blurX = 0;
    reel.blur.blurY = 0;
    rc.filters = [reel.blur];

    // Build symbols for 4 visible rows plus 1 hidden symbol at the top.
    for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
      const symbolContainer = new Container();

      const randomType = symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
      setSymbolType(symbolContainer, randomType);

      symbolContainer.y = j * SYMBOL_SIZE - SYMBOL_SIZE;

      reel.symbols.push(symbolContainer);
      rc.addChild(symbolContainer);
    }
    reels.push(reel);
  }

  // Create background sprite from Board.png
  const background = new Sprite(Texture.from("/AA/Atest.png"));
  background.width = BOARD_DISPLAY_WIDTH;
  background.height = BOARD_DISPLAY_HEIGHT;
  background.x = Math.round((app.screen.width - background.width) / 2);
  background.y = Math.round((app.screen.height - background.height) / 2) - 50;
  app.stage.addChild(background);

  // Position reelContainer inside the Board's grid area
  reelContainer.x = background.x + GRID_X;
  reelContainer.y = background.y + GRID_Y;

  // Create a mask to hide symbols outside the reel area
  const reelMask = new Graphics()
    .rect(0, 0, GRID_WIDTH, GRID_HEIGHT)
    .fill({ color: 0xffffff });
  reelContainer.addChild(reelMask);
  reelContainer.mask = reelMask;

  app.stage.addChild(reelContainer);

  //------------------------------------------------------------------------------------------------------
  // Build bottom covers
  const margin = background.y + GRID_Y;

  const bottom = new Graphics()
    .rect(0, GRID_HEIGHT + margin, app.screen.width, app.screen.height - (GRID_HEIGHT + margin))
    .fill({ color: 0x0, alpha: 0.0 });

  const playButton = new Sprite(Texture.from("/AA/play_button.png"));
  playButton.anchor.set(0.5);
  const baseScale = 90 / playButton.texture.width;
  playButton.scale.set(baseScale);

  playButton.x = Math.round(app.screen.width / 2);
  const bottomCoverHeight = app.screen.height - (GRID_HEIGHT + margin);
  playButton.y = GRID_HEIGHT + margin + Math.round(bottomCoverHeight / 2) - 50;

  playButton.eventMode = "static";
  playButton.cursor = "pointer";

  playButton.on("pointerover", () => {
    if (!running) playButton.scale.set(baseScale * 1.1);
  });
  playButton.on("pointerout", () => {
    if (!running) playButton.scale.set(baseScale);
  });
  playButton.on("pointerdown", () => {
    if (!running) {
      playButton.scale.set(baseScale * 0.9);
      startPlay();
    }
  });
  playButton.on("pointerup", () => {
    if (!running) playButton.scale.set(baseScale * 1.1);
  });
  playButton.on("pointerupoutside", () => {
    if (!running) playButton.scale.set(baseScale);
  });

  bottom.addChild(playButton);
  app.stage.addChild(bottom);

  let running = false;
  function startPlay() {
    if (running) return;

    running = true;

    playButton.alpha = 0.5;
    playButton.scale.set(baseScale);
    playButton.cursor = "default";

    const baseSpinDistance = 20;
    const baseSpinTime = 1200;
    const stopDelayPerReel = 100;
    const extraSpinStepsPerReel = 4;

    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      const spinDistance = baseSpinDistance + i * extraSpinStepsPerReel;
      const spinTime = baseSpinTime + i * stopDelayPerReel;
      const isLastReel = i === reels.length - 1;

      tweenTo(
        r,
        "position",
        r.position + spinDistance,
        spinTime,
        null,
        () => {
          playLandingForReel(r);
          if (isLastReel) reelsComplete();
        },
      );
    }
  }

  function playLandingForReel(reel) {
    for (let j = 0; j < reel.symbols.length; j++) {
      const s = reel.symbols[j];
      if (s.isSpine && s.y >= 0 && s.y < GRID_HEIGHT - 10) {
        const spineObj = s.displayObject;
        const landingAnim = "landing";
        const idleAnim = s.symbolType === "sombrero" ? "default" : "idle";

        spineObj.state.setAnimation(0, landingAnim, false);
        spineObj.state.addAnimation(0, idleAnim, true, 0);
      }
    }
  }

  // All reels done handler.
  function reelsComplete() {
    running = false;
    playButton.alpha = 1.0;
    playButton.cursor = "pointer";
  }

  // Listen for animate update.
  app.ticker.add(() => {
    // Update the slots.
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      // Update blur filter y amount based on speed.
      r.blur.blurY = (r.position - r.previousPosition) * 8;
      r.previousPosition = r.position;

      // Update symbol positions on reel.
      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;

        s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;

        if (s.y < 0 && prevy > SYMBOL_SIZE) {
          // Detect going over and swap a texture/symbol type.
          const randomType = symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
          setSymbolType(s, randomType);
        }
      }
    }
  });

  // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
  const tweening = [];

  function tweenTo(
    object,
    property,
    target,
    time,
    onchange,
    oncomplete,
  ) {
    const tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
    };

    tweening.push(tween);

    return tween;
  }
  // Listen for animate update.
  app.ticker.add(() => {
    const now = Date.now();
    const remove = [];

    for (let i = 0; i < tweening.length; i++) {
      const t = tweening[i];
      const phase = Math.min(1, (now - t.start) / t.time);

      t.object[t.property] = lerp(
        t.propertyBeginValue,
        t.target,
        phase,
      );
      if (t.change) t.change(t);
      if (phase === 1) {
        t.object[t.property] = t.target;
        if (t.complete) t.complete(t);
        remove.push(t);
      }
    }
    for (let i = 0; i < remove.length; i++) {
      tweening.splice(tweening.indexOf(remove[i]), 1);
    }
  });

  // Basic lerp funtion.
  function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
  }

})();
