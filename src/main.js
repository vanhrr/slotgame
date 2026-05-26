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
  await app.init({
    background: "#f8d1e4ff",
    width: 920,
    height: 800,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    resizeTo: window,
  });

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
    "/AA/BG5.png",
    "/AA/Maracas.png",
    "/AA/Wild.png",
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
  const BOARD_DISPLAY_SCALE = BOARD_DISPLAY_WIDTH / BOARD_ORIG_WIDTH;
  const BOARD_DISPLAY_HEIGHT = BOARD_ORIG_HEIGHT * BOARD_DISPLAY_SCALE;

  const scaleX = BOARD_DISPLAY_SCALE;
  const scaleY = BOARD_DISPLAY_SCALE;

  // Grid coordinates relative to original Atest.png (1908x1566).
  // Keep the reel mask inside the gold frame so symbols do not overlap the board.
  const GRID_ORIG_X = 205;
  const GRID_ORIG_Y = 210;
  const GRID_ORIG_WIDTH = 1510;
  const GRID_ORIG_HEIGHT = 1190;
  const SYMBOL_TRACK_ORIG_HEIGHT = 1210;
  const FIRST_REEL_OVERLAP_ORIG = 0;

  // Scaled coordinates on screen
  const GRID_X = GRID_ORIG_X * scaleX;
  const GRID_Y = GRID_ORIG_Y * scaleY;
  const GRID_WIDTH = GRID_ORIG_WIDTH * scaleX;
  const GRID_HEIGHT = GRID_ORIG_HEIGHT * scaleY;
  const SYMBOL_TRACK_HEIGHT = SYMBOL_TRACK_ORIG_HEIGHT * scaleY;
  const FIRST_REEL_OVERLAP = FIRST_REEL_OVERLAP_ORIG * scaleX;

  const REEL_COUNT = 5;
  const ROW_COUNT = 4;
  const SYMBOLS_PER_REEL = ROW_COUNT + 1;
  const REEL_GAP = 6;
  const FIT_SCALE = 0.85;
  const PNG_SCALE = 0.7;
  const SYMBOL_OFFSET = -6;
  const BOARD_Y_OFFSET = -50;
  const PLAY_BUTTON_Y_OFFSET = -50;
  const PLAY_BUTTON_WIDTH = 90;
  const BG_ORIG_WIDTH = 2752;
  const BG_ORIG_HEIGHT = 1536;
  const BLUR_SPEED = 8;
  const DEFAULT_CELL_SCALE = 1;
  const DEFAULT_CELL_OFFSET_X = 0;
  const DEFAULT_CELL_OFFSET_Y = 0;
  const DEFAULT_CELL_OVERFLOW_X = 0;
  const DEFAULT_CELL_OVERFLOW_Y = 0;
  const SYMBOL_POOL_LIMIT = SYMBOLS_PER_REEL;

  // Dimensions of each cell in the 5x4 grid
  const REEL_WIDTH = (GRID_WIDTH - REEL_GAP * (REEL_COUNT - 1)) / REEL_COUNT;
  const SYMBOL_SIZE = SYMBOL_TRACK_HEIGHT / ROW_COUNT;

  const symbolTypes = [
    { id: "maracas", kind: "texture", texture: Texture.from("/AA/Maracas.png") },
    { id: "wild", kind: "texture", texture: Texture.from("/AA/Wild.png") },
    {
      id: "female",
      kind: "spine",
      layout: "cover",
      skeleton: "female_skeleton",
      atlas: "female_atlas",
      idle: "idle",
      cellScale: 1.1,
      cellOffsetX: -5,
      cellOffsetY: -3,
      cellOverflowX: 18,
      cellOverflowY: 18,
    },
    {
      id: "male",
      kind: "spine",
      layout: "cover",
      skeleton: "male_skeleton",
      atlas: "male_atlas",
      idle: "idle",
      cellScale: 1.1,
      cellOffsetX: -5,
      cellOffsetY: -3,
      cellOverflowX: 18,
      cellOverflowY: 18,
    },
    {
      id: "sombrero",
      kind: "spine",
      layout: "fit",
      skeleton: "sombrero_skeleton",
      atlas: "sombrero_atlas",
      idle: "default",
    },
  ];

  function setupSymbolLayout(symbolConfig, displayObject) {
    const isSpine = symbolConfig.kind === "spine";
    let origWidth, origHeight;
    let boundsX = 0;
    let boundsY = 0;
    if (isSpine) {
      boundsX = displayObject.skeleton.data.x;
      boundsY = displayObject.skeleton.data.y;
      origWidth = displayObject.skeleton.data.width;
      origHeight = displayObject.skeleton.data.height;
    } else {
      origWidth = displayObject.texture.width;
      origHeight = displayObject.texture.height;
    }

    if (symbolConfig.layout === "cover") {
      const scale = Math.max(REEL_WIDTH / origWidth, SYMBOL_SIZE / origHeight)
        * (symbolConfig.cellScale ?? DEFAULT_CELL_SCALE);
      const offsetX = symbolConfig.cellOffsetX ?? DEFAULT_CELL_OFFSET_X;
      const offsetY = symbolConfig.cellOffsetY ?? DEFAULT_CELL_OFFSET_Y;

      displayObject.scale.set(scale);
      displayObject.x = (REEL_WIDTH - origWidth * scale) / 2 - boundsX * scale + offsetX;
      displayObject.y = (SYMBOL_SIZE - origHeight * scale) / 2 - boundsY * scale + offsetY;
    } else if (isSpine) {
      const scale = Math.min(
        REEL_WIDTH / origWidth,
        SYMBOL_SIZE / origHeight,
      ) * FIT_SCALE;

      displayObject.scale.set(scale);
      displayObject.x = REEL_WIDTH / 2 + SYMBOL_OFFSET;
      displayObject.y = SYMBOL_SIZE / 2 + SYMBOL_OFFSET;
    } else {
      const scale = Math.min(
        REEL_WIDTH / origWidth,
        SYMBOL_SIZE / origHeight,
      ) * PNG_SCALE;

      displayObject.scale.set(scale);
      displayObject.x = Math.round((REEL_WIDTH - displayObject.width) / 2) + SYMBOL_OFFSET;
      displayObject.y = Math.round((SYMBOL_SIZE - displayObject.height) / 2) + SYMBOL_OFFSET;
    }
  }

  function createSymbolContainer() {
    const symbolContainer = new Container();
    const viewLayer = new Container();

    symbolContainer.viewLayer = viewLayer;
    symbolContainer.addChild(viewLayer);

    return symbolContainer;
  }

  function getRandomSymbolType() {
    return symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
  }

  function resetSpineAnimation(displayObject, idleAnimation) {
    displayObject.state.clearTracks();
    displayObject.skeleton.setToSetupPose();
    displayObject.state.setAnimation(0, idleAnimation, true);
  }

  function createSymbolView(symbolConfig) {
    if (symbolConfig.kind === "spine") {
      const displayObject = Spine.from({
        skeleton: symbolConfig.skeleton,
        atlas: symbolConfig.atlas,
      });

      resetSpineAnimation(displayObject, symbolConfig.idle);
      return displayObject;
    }

    return new Sprite(symbolConfig.texture);
  }

  const symbolPools = new Map();

  function acquireSymbolView(symbolConfig) {
    const pool = symbolPools.get(symbolConfig.id);
    const displayObject = pool?.pop() ?? createSymbolView(symbolConfig);

    if (symbolConfig.kind === "spine") {
      resetSpineAnimation(displayObject, symbolConfig.idle);
    }

    return displayObject;
  }

  function releaseSymbolView(symbolConfig, displayObject) {
    const pool = symbolPools.get(symbolConfig.id) ?? [];
    symbolPools.set(symbolConfig.id, pool);

    if (pool.length >= SYMBOL_POOL_LIMIT) {
      displayObject.destroy({ children: true });
      return;
    }

    displayObject.visible = false;
    pool.push(displayObject);
  }

  function getCellMask(symbolContainer) {
    if (!symbolContainer.cellMask) {
      symbolContainer.cellMask = new Graphics();
    }

    return symbolContainer.cellMask;
  }

  function setCellMaskEnabled(symbolContainer, enabled) {
    if (enabled) {
      const cellMask = getCellMask(symbolContainer);
      const overflowX = symbolContainer.symbolConfig.cellOverflowX ?? DEFAULT_CELL_OVERFLOW_X;
      const overflowY = symbolContainer.symbolConfig.cellOverflowY ?? DEFAULT_CELL_OVERFLOW_Y;

      cellMask
        .clear()
        .rect(
          -overflowX,
          -overflowY,
          REEL_WIDTH + overflowX * 2,
          SYMBOL_SIZE + overflowY * 2,
        )
        .fill({ color: 0xffffff });

      if (!cellMask.parent) {
        symbolContainer.addChild(cellMask);
      }

      symbolContainer.viewLayer.mask = cellMask;
      return;
    }

    symbolContainer.viewLayer.mask = null;

    if (symbolContainer.cellMask?.parent) {
      symbolContainer.cellMask.parent.removeChild(symbolContainer.cellMask);
    }
  }

  function setSymbolType(symbolContainer, symbolConfig) {
    if (symbolContainer.displayObject) {
      symbolContainer.viewLayer.removeChild(symbolContainer.displayObject);
      releaseSymbolView(symbolContainer.symbolConfig, symbolContainer.displayObject);
    }

    const displayObject = acquireSymbolView(symbolConfig);

    displayObject.visible = true;
    setupSymbolLayout(symbolConfig, displayObject);
    symbolContainer.symbolConfig = symbolConfig;
    symbolContainer.displayObject = displayObject;
    symbolContainer.isSpine = symbolConfig.kind === "spine";
    symbolContainer.viewLayer.addChild(displayObject);
    setCellMaskEnabled(symbolContainer, symbolConfig.layout === "cover");
  }

  // Build the reels
  const reels = [];
  const reelContainer = new Container();

  for (let i = 0; i < REEL_COUNT; i++) {
    const rc = new Container();

    rc.x = i * (REEL_WIDTH + REEL_GAP);
    if (i === 0) rc.x -= FIRST_REEL_OVERLAP;
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
      const symbolContainer = createSymbolContainer();

      setSymbolType(symbolContainer, getRandomSymbolType());

      symbolContainer.y = j * SYMBOL_SIZE - SYMBOL_SIZE;

      reel.symbols.push(symbolContainer);
      rc.addChild(symbolContainer);
    }
    reels.push(reel);
  }

  // Create app background sprite
  const appBackground = new Sprite(Texture.from("/AA/BG5.png"));
  app.stage.addChild(appBackground);

  // Create board sprite
  const board = new Sprite(Texture.from("/AA/Atest.png"));
  app.stage.addChild(board);

  // Create a mask to hide symbols outside the reel area.
  // Extend it left so the first reel can overlap the board instead of being clipped.
  const reelMask = new Graphics()
    .rect(-FIRST_REEL_OVERLAP, 0, GRID_WIDTH + FIRST_REEL_OVERLAP, GRID_HEIGHT)
    .fill({ color: 0xffffff });
  reelContainer.addChild(reelMask);
  reelContainer.mask = reelMask;

  app.stage.addChild(reelContainer);

  //------------------------------------------------------------------------------------------------------
  // Build bottom covers
  const bottom = new Graphics();

  const playButton = new Sprite(Texture.from("/AA/play_button.png"));
  playButton.anchor.set(0.5);
  const baseScale = PLAY_BUTTON_WIDTH / playButton.texture.width;
  playButton.scale.set(baseScale);

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
  app.renderer.on("resize", layoutScene);
  layoutScene();

  let running = false;
  function startPlay() {
    if (running) return;

    running = true;

    playButton.alpha = 0.5;
    playButton.scale.set(baseScale);
    playButton.cursor = "default";

    const baseSpinDistance = 12;
    const baseSpinTime = 1500;
    const stopDelayPerReel = 200;
    const extraSpinStepsPerReel = 4;
    const windUpDistance = 0.18;
    const windUpTime = 120;

    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      const startPosition = r.position;
      const spinDistance = baseSpinDistance + i * extraSpinStepsPerReel;
      const spinTime = baseSpinTime + i * stopDelayPerReel;
      const isLastReel = i === reels.length - 1;

      tweenTo(
        r,
        "position",
        startPosition - windUpDistance,
        windUpTime,
        null,
        () => {
          tweenTo(
            r,
            "position",
            startPosition + spinDistance,
            spinTime,
            null,
            () => {
              updateReelSymbols(r);
              playLandingForReel(r);
              if (isLastReel) reelsComplete();
            },
          );
        },
      );
    }
  }

  function playLandingForReel(reel) {
    for (let j = 0; j < reel.symbols.length; j++) {
      const s = reel.symbols[j];
      if (s.isSpine && isSymbolVisible(s)) {
        const spineObj = s.displayObject;
        const landingAnim = "landing";
        const idleAnim = s.symbolConfig.idle;

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

  function layoutScene() {
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    const bgScale = Math.max(
      screenWidth / BG_ORIG_WIDTH,
      screenHeight / BG_ORIG_HEIGHT,
    );

    appBackground.width = BG_ORIG_WIDTH * bgScale;
    appBackground.height = BG_ORIG_HEIGHT * bgScale;
    appBackground.x = Math.round((screenWidth - appBackground.width) / 2);
    appBackground.y = Math.round((screenHeight - appBackground.height) / 2);

    board.width = BOARD_DISPLAY_WIDTH;
    board.height = BOARD_DISPLAY_HEIGHT;
    board.x = Math.round((screenWidth - board.width) / 2);
    board.y = Math.round((screenHeight - board.height) / 2) + BOARD_Y_OFFSET;

    reelContainer.x = board.x + GRID_X;
    reelContainer.y = board.y + GRID_Y;

    const margin = board.y + GRID_Y;
    bottom
      .clear()
      .rect(0, GRID_HEIGHT + margin, screenWidth, screenHeight - (GRID_HEIGHT + margin))
      .fill({ color: 0x0, alpha: 0.0 });

    playButton.x = Math.round(screenWidth / 2);
    const bottomCoverHeight = screenHeight - (GRID_HEIGHT + margin);
    playButton.y = GRID_HEIGHT + margin + Math.round(bottomCoverHeight / 2) + PLAY_BUTTON_Y_OFFSET;
  }

  function isSymbolVisible(symbolContainer) {
    return (
      symbolContainer.y > -SYMBOL_SIZE / 2
      && symbolContainer.y < GRID_HEIGHT - SYMBOL_SIZE / 2
    );
  }

  function updateReelSymbols(reel) {
    for (let j = 0; j < reel.symbols.length; j++) {
      const s = reel.symbols[j];
      const prevy = s.y;

      s.y = ((reel.position + j) % reel.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;

      if (s.y < 0 && prevy > SYMBOL_SIZE) {
        setSymbolType(s, getRandomSymbolType());
      }
    }
  }

  function updateReels() {
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      r.blur.blurY = (r.position - r.previousPosition) * BLUR_SPEED;
      r.previousPosition = r.position;
      updateReelSymbols(r);
    }
  }

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
  function updateTweens() {
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
  }

  app.ticker.add(() => {
    updateReels();
    updateTweens();
  });

  // Basic lerp funtion.
  function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
  }

})();
