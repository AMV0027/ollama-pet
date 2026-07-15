# 🎭 Animation & Sprite Customization Guide

Ollama Pet renders the desktop companion using frame-by-frame PNG animations. This document explains how the animation engine works and details how to customize sprites or add new pet states.

---

## 📂 Sprite Asset Layout

All pet animations are located in `src/assets/ollamapet_sprite/`. Every animation corresponds to a subfolder:

```text
src/assets/ollamapet_sprite/
├── idle/
│   ├── idle.png          # Single static fallback frame
│   └── metadata.json
├── walking/
│   ├── 1.png             # Frame 1
│   ├── 2.png             # Frame 2
│   ├── ...
│   └── metadata.json
├── sleeping/
│   ├── 1.png
│   ├── 2.png
│   └── metadata.json
```

---

## ⚙️ React Animation Engine

The [Pet.tsx](file:///src/components/Pet/Pet.tsx) component runs the animation loop. Here is the process:

1. **Vite Dynamic Asset Globbing**:
   Vite's `import.meta.glob` compiles a registry of all PNG assets under the sprite directory at build time:
   ```typescript
   const spriteModules = import.meta.glob<{ default: string }>(
     '../../assets/ollamapet_sprite/**/*.png',
     { eager: true }
   );
   ```

2. **Frame Sorting**:
   To ensure frames play in the correct sequence, the files in each folder are sorted numerically or alphabetically by file name:
   ```typescript
   function getFrames(folder: string): string[] {
     const keys = Object.keys(spriteModules).filter((k) => k.includes(`/${folder}/`));
     keys.sort((a, b) => {
       const aFile = a.split('/').pop() ?? '';
       const bFile = b.split('/').pop() ?? '';
       const aNum = parseInt(aFile);
       const bNum = parseInt(bFile);
       if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
       return aFile.localeCompare(bFile);
     });
     return keys.map((k) => spriteModules[k].default);
   }
   ```

3. **Loop & Speed Configuration**:
   The `ANIM_CONFIG` map defines whether an animation loops and how long a complete cycle takes:
   ```typescript
   interface AnimConfig {
     frames: string[];
     cycleDurationMs: number;
     loop: boolean;
   }
   
   const ANIM_CONFIG: Record<PetState, AnimConfig> = {
     Idle:     { frames: getFrames('idle'),        cycleDurationMs: 0,    loop: false },
     Looking:  { frames: getFrames('looking'),     cycleDurationMs: 1200, loop: true  },
     Thinking: { frames: getFrames('thinking'),    cycleDurationMs: 2000, loop: true  },
     Talking:  { frames: getFrames('speaking'),    cycleDurationMs: 800,  loop: true  },
     Typing:   { frames: getFrames('using_laptop'),cycleDurationMs: 1000, loop: true  },
     Walking:  { frames: getFrames('walking'),     cycleDurationMs: 800,  loop: true  },
     Sleeping: { frames: getFrames('sleeping'),    cycleDurationMs: 1000, loop: true  },
     Waving:   { frames: getFrames('waving'),      cycleDurationMs: 600,  loop: true  },
     Jumping:  { frames: getFrames('jumping'),     cycleDurationMs: 600,  loop: false },
     Dragging: { frames: getFrames('walking'),     cycleDurationMs: 800,  loop: true  },
   };
   ```

---

## 🎨 Customizing the Pet

### Option A: Replacing Existing Sprites
To replace the default pet with your own character:
1. Delete the files inside the subfolders of `src/assets/ollamapet_sprite/` (e.g. `idle`, `walking`, `sleeping`, etc.).
2. Put your own PNG files in their place.
3. Ensure you name them sequentially: `1.png`, `2.png`, `3.png`, `4.png` etc.
4. Restart the development server to clear Vite's cache:
   ```bash
   npm run tauri dev
   ```

### Option B: Adding a New Animation State
If you want to add a brand new state (e.g., `Eating` or `Playing`):
1. **Define the State**: In [usePetStore.ts](file:///src/stores/usePetStore.ts), add the state name to the `PetState` union:
   ```typescript
   export type PetState = 'Idle' | 'Walking' | ... | 'Eating';
   ```
2. **Add Asset Folder**: Create the folder `src/assets/ollamapet_sprite/eating/` and populate it with frames (`1.png`, `2.png`, etc.).
3. **Register Configuration**: In [Pet.tsx](file:///src/components/Pet/Pet.tsx), update `ANIM_CONFIG`:
   ```typescript
   Eating: { frames: getFrames('eating'), cycleDurationMs: 1200, loop: true }
   ```
4. **Trigger the State**: Update state triggers in [App.tsx](file:///src/App.tsx) (e.g., in the idle pool array or when certain chat keywords are met) to transition into the state:
   ```typescript
   setPetState('Eating');
   ```
