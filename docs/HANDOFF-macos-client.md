# Handoff: getting the macOS client to launch

Written 2026-08-26 at the end of a long remote debugging session, for whoever
picks this up on an actual Mac. Everything below was established from a Windows
machine plus the game VPS, which is why the last few steps stalled: the
remaining questions need a Mac to answer.

**The one-line summary:** the macOS build is now correctly signed, but it still
refuses to launch on an Apple Silicon Mac with "not supported on this Mac", and
we have not yet confirmed whether the tester was even running the new build.

---

## Hard constraints (do not "fix" these)

**The build must target x64.** `plugins/PepperFlashPlayer.plugin` is a universal
binary with `i386` and `x86_64` slices and **no arm64 slice** (verified by
parsing its Mach-O fat header). A native arm64 client would launch and render
nothing, because the game is a Flash SWF and the plugin cannot load. Apple
Silicon must run the x64 build under Rosetta 2. This is why
`.github/workflows/build-mac.yml` defaults `arch` to `x64`.

**The app must be at least ad-hoc signed.** `CSC_IDENTITY_AUTO_DISCOVERY: "false"`
on its own produces a bundle with no signature at all, and macOS 13+ kills an
unsigned Electron app *silently* — the user approves it under Privacy & Security,
double-clicks, and nothing happens, with no error anywhere. `codesign -dv`
reported "code object is not signed at all" on the first build. Fixed; see below.

**Electron is pinned to 11.0.0 deliberately.** Electron 12 removed Pepper Flash.
Do not upgrade it. It must also appear only in `devDependencies` — having it in
both `dependencies` and `devDependencies` makes electron-builder refuse to build.

**The Flash plugin lives in `Contents/plugins`, not `Contents/Resources`.**
`package.json` maps `extraResources: [{ from: "plugins/", to: "../plugins/" }]`
because `src/main/tools/flash.js` resolves it as `resourcesPath/../plugins` on
every platform. That is a non-standard location inside a `.app`, so the bundle
must be signed *after* electron-builder assembles it or the resource envelope
will not match what is on disk. Hence the `--dir` → sign → `--prepackaged`
sequence in the workflow.

---

## What is already fixed

`fix/mac-adhoc-signing` (2 commits, pushed to `shipnlabels/sw-client`):

1. **Ad-hoc signing.** Build `--dir`, sign inside-out (nested frameworks and
   helper `.app`s first, then the outer bundle), verify with
   `codesign --verify --deep --strict`, then repackage with `--prepackaged`.
   **Confirmed working** — the produced DMG contains 27 `_CodeSignature`
   directories where the previous build had none.
2. **Release publishing.** The DMG is published as a GitHub release asset.
   Workflow *artifacts* need an authenticated download; release assets on a
   public repo do not, so the web server can `curl` the installer itself.

Both repos (`shipnlabels/sw-client`, `shipnlabels/sw-streaming`) are **public**.

---

## What is still broken

The tester's Mac is **Apple Silicon** (`uname -m` → `arm64`), running
**macOS 15.4.1 (24E263)**. The signed x86_64 app still reports
**"not supported on this Mac"**.

That message means macOS found no runnable architecture in the main executable.
For an x86_64 app on Apple Silicon it normally means Rosetta 2 is missing — but
macOS usually offers to install Rosetta rather than refusing outright, so this
is not fully explained yet.

### Unverified — check these FIRST

These are cheap and one of them may end the whole investigation:

```sh
# 1. Is the tester actually running the new build?
ls -l ~/Downloads/SmallWorlds-1.0.0.dmg      # MUST be 212037813 bytes
```

`210324203` bytes is the **old unsigned build**. This was asked for twice during
the session and never answered. If the browser served a cached download, every
conclusion after the signing fix is worthless and the app simply needs to be
re-downloaded. **Rule this out before anything else.**

```sh
# 2. Does Rosetta actually work?
arch -x86_64 uname -m
```

`x86_64` means Rosetta is fine. `Bad CPU type in executable` means it is not
installed. `sudo softwareupdate --install-rosetta --agree-to-license` was
suggested but its output was never seen — plain
`softwareupdate --install-rosetta` had failed with "Rosetta 2 update is not
available", which is ambiguous (it says much the same thing whether Rosetta is
already present or the command lacks privileges).

```sh
# 3. What architecture is the installed app, really?
lipo -archs /Applications/SmallWorlds.app/Contents/MacOS/SmallWorlds
codesign -dv --verbose=4 /Applications/SmallWorlds.app
spctl -a -vvv /Applications/SmallWorlds.app
```

```sh
# 4. The real error, instead of Finder's vague dialog
/Applications/SmallWorlds.app/Contents/MacOS/SmallWorlds
ls -t ~/Library/Logs/DiagnosticReports | head -5
```

Always drag the app to `/Applications` first. Launching from the mounted DMG
fails for unrelated reasons and muddies the diagnosis.

---

## Known secondary issue: a stray arm64 module

Scanning the DMG's APFS partition for Mach-O headers found:

```
x86_64: 20 images
arm64:   1 image   (MH_BUNDLE — a .node native module)
```

`macos-latest` is now an Apple Silicon runner, so a native Node module was built
for the **host** arch instead of the **target** arch. This is *not* the launch
blocker — macOS decides "not supported" from the main executable before loading
nested modules — but an x86_64 process under Rosetta **cannot** load an arm64
module, so expect a crash or missing functionality once the app does start.

Fix: force the target architecture when installing/rebuilding native deps in the
workflow (`npm_config_arch=x64`, `npm_config_target_arch=x64`, or an explicit
`electron-rebuild --arch=x64`) before `electron-builder` runs. Locating which
module it is on a Mac is trivial:

```sh
find /Applications/SmallWorlds.app -name "*.node" -exec lipo -archs {} \; -print
```

---

## Dead ends — already ruled out, do not repeat

Three theories were pursued and disproved. They are listed so nobody burns
another cycle on them:

| Theory | Why it was wrong |
|---|---|
| The build targeted arm64 by mistake | `file` on the main executable returned `Mach-O 64-bit executable x86_64` |
| Rosetta just needed installing | Plausible, but the install command's output was never actually confirmed — **still open**, see check 2 |
| The Mac was Intel | `uname -m` returned `arm64`. This was *inferred* from the ambiguous Rosetta message for several rounds and was simply wrong |

The methodological lesson, offered honestly: `uname -m` should have been
obtained in the first five minutes. Several rounds were spent building theories
on an inference about the hardware rather than a fact.

---

## Build and deploy pipeline

**Build:** GitHub Actions → `Build macOS client` → Run workflow. Branch
`fix/mac-adhoc-signing`, arch `x64`. Takes about 3 minutes. It publishes a
release tagged `mac-x64-<timestamp>` with the DMG attached.

**Deploy:** the site serves installers from the web root on the VPS:

```
/var/www/playsmallworlds/web/updates/mac/SmallWorlds-1.0.0.dmg
/var/www/playsmallworlds/web/updates/win/SmallWorlds-Setup-1.0.0.exe
```

`https://playsmallworlds.com/download/` already links to those exact paths, so
deploying is just replacing the file (and `chown smallworlds:www-data`,
`chmod 644`). Because releases are public, the server can fetch a build itself
with `curl -L <release asset url>`.

The current signed DMG is already live there. The previous unsigned one is
backed up at `/root/SmallWorlds-1.0.0.dmg.unsigned-bak`.

**Not done:** `updates/mac/latest-mac.yml` is stale — it still describes the old
build (`size: 210324203`) and references a `SmallWorlds-1.0.0-mac.zip` that was
never uploaded. Nothing reads it today because the client's updater is a no-op,
but it will fail a hash check if auto-updates are ever switched on. Regenerate
it properly (and publish the zip) at that point rather than patching it now.

VPS access credentials are held by the project owner and are deliberately not
recorded here.

---

## Wider project state, for context

Server-side work from the same session is on `shipnlabels/sw-streaming`, branch
`fix/item-positions-and-chat` (3 commits, deployed and live). Relevant if the
Mac client misbehaves in-game rather than at launch:

- **Item positions.** `avatar_items` is the source of truth; the Red5 shared
  object is what the client renders. Four defects let them diverge, so moves
  were saved correctly and then overwritten on screen by a stale copy. Fixed.
  The commit message on `Make avatar_items authoritative for placed item
  positions` documents all four in detail.
- **Chat.** `say()`/`emote()` threw `ArrayIndexOutOfBoundsException` when the
  client omitted the avatar id. Fixed.
- **Space aliases.** A room scope may be an alias rather than a numeric id;
  passing that into a `BIGINT` parameter aborted `roomConnect` partway through.
  Fixed.

The Red5 game server is a single jar at
`/var/www/playsmallworlds/red5/plugins/swms-server-0.7.jar` — **not** in
`webapps/swms/WEB-INF/`. The VPS has a JRE only (no `mvn`, no `javac`), so small
Java changes are compiled elsewhere with `javac --release 22` (deployed bytecode
is major 66) against jars copied from `red5/lib`, patched in with `jar uf`, then
uploaded and `systemctl restart smallworlds-red5`. Back the jar up first; a
restart drops everyone in-game.

Still open, unrelated to macOS: registration sessions expire after 120 minutes
versus 30 days for login; no email verification; no password minimum; the
Windows installer still ships the generic Electron icon.
