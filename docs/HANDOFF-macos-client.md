# Handoff: getting the macOS client to launch

Written 2026-08-26 at the end of a long remote debugging session, for whoever
picks this up on an actual Mac. Everything below was established from a Windows
machine plus the game VPS, which is why the last few steps stalled: the
remaining questions need a Mac to answer.

> **CORRECTION 2026-08-26, later the same day.** A concurrent session (this
> same one, different window) reached this file's previous conclusion —
> "quarantine alone fixes it, players are walked through it on the download
> page" — and that conclusion is **incomplete and the live download page
> instructions do not actually work**. Freshly re-tested on this Mac with a
> clean, unmodified copy of the app: stripping *only* `com.apple.quarantine`
> and then launching via `open` (the same code path as a real double-click)
> **still fails outright**, zero processes spawn, "incorrect executable
> format". The earlier "it worked" result came from testing via a raw
> terminal invocation of the binary — which the original handoff doc's own
> "check the real error" step suggests doing — and that path bypasses
> LaunchServices entirely, so it silently sidesteps the actual bug real users
> hit. See RESOLVED #1 below: the download page needs the *rebuilt* DMG, not
> just better instructions on top of the current one.

**UPDATE 2026-08-26, same day, from an actual Mac:** two separate bugs found,
both fixed, and the app now launches and renders correctly through a normal
double-click. Neither was an architecture problem. See the two "RESOLVED"
sections below before reading the rest of this doc — most of what follows is
the (now-obsolete) investigation trail that led there.

---

## RESOLVED #1 (the one that actually matters): `LSRequiresNativeExecution`

This is almost certainly what the original tester hit, because it blocks the
*only* way a real user launches the app — double-click, Dock, Spotlight, the
`open` command. It does **not** block running the raw binary directly from a
terminal, which is a different code path that skips LaunchServices entirely.
That distinction is why this was missed for so long and only surfaced once
testing happened on a real Mac with a real double-click.

The shipped `Info.plist` had:

```
LSRequiresNativeExecution = true
```

This tells LaunchServices to refuse Rosetta translation altogether for this
app. Since the binary is x86_64-only by design (the Flash plugin constraint,
see below), LaunchServices had no native slice to run and rejected the launch
with "incorrect executable format" / "not supported on this Mac" — before the
process even started, no crash log, nothing in Console beyond that.

Confirmed the fix locally: flipping the key to `false` in the installed app's
`Info.plist` (via `PlistBuddy`) let `open` launch it successfully. Note:
re-signing that local test with a blunt `codesign --force --deep --sign -`
afterward *broke* the nested helper processes (only the main process started,
no window ever appeared) — proper inside-out signing with entitlements
(exactly what `build-mac.yml`'s "Ad-hoc sign the app bundle" step already
does) is required; don't hand-patch an installed app as the real fix.

**Real fix, already applied:** `package.json`'s `build.mac` config now sets

```json
"extendInfo": { "LSRequiresNativeExecution": false }
```

electron-builder had been setting this key to `true` on its own; this
overrides it. Needs a CI rebuild (existing `build-mac.yml`, unchanged
otherwise) to actually take effect — a hand-edited `Info.plist` on an already
-built `.app` is not a real fix, just how this was diagnosed.

---

## RESOLVED #2: Gatekeeper quarantine (separate, secondary issue)

`/Applications/SmallWorlds.app` was already the correctly signed x86_64 build
(confirmed via `codesign -dv` — ad-hoc signature present, `lipo -archs` →
`x86_64`). `codesign --verify --deep --strict` passed clean. Launching it
still got silently killed (exit 137 / SIGKILL) with nothing in Finder but
"not supported on this Mac".

The unified log had the real reason:

```
kernel: (AppleSystemPolicy) ASP: Security policy would not allow process: <pid>, /Applications/SmallWorlds.app/Contents/MacOS/SmallWorlds
```

`xattr -l` on the app showed `com.apple.quarantine: ...;Safari;...` — Safari
quarantines every download, and Gatekeeper refuses to run a quarantined app
that is only ad-hoc signed (no Developer ID, not notarized). On macOS 15
Sequoia this shows up as the misleading "not supported on this Mac" rather
than the classic "cannot verify developer" dialog, which is why this looked
like an architecture failure for so long.

**Fix that confirmed it:**

```sh
xattr -dr com.apple.quarantine /Applications/SmallWorlds.app
open /Applications/SmallWorlds.app
```

App launched, all four processes stayed alive (main + GPU helper + renderer +
network helper), registered as foreground with LaunchServices, and rendered
the actual game world (tested in a real room, "crazy monkey's House" — 3D
avatar, Flash-rendered furniture, inventory/currency UI all working) under
Rosetta 2. Rosetta itself was never the problem either — `arch -x86_64 uname -m`
worked fine the whole time.

**This is not a per-machine fix — every user hitting playsmallworlds.com and
downloading via a browser will get the same quarantine flag and the same
block.** The one-time `xattr -dr` above only fixes this one already-downloaded
copy. Real options, in order of how much they cost:

1. **Notarize the build.** Requires an Apple Developer Program membership
   ($99/yr) tied to an Apple ID, a Developer ID Application certificate, and
   adding a `notarytool` submit-and-staple step to
   `.github/workflows/build-mac.yml` after the existing ad-hoc sign step. This
   is the only option that makes the DMG "just work" with a normal double-click
   for every user, no instructions needed. Requires the project owner to
   enroll — not something that can be done from CI credentials alone.
2. **Tell users to clear Gatekeeper manually.** Either right-click → Open (may
   still be blocked outright on Sequoia for non-notarized apps depending on
   config) or System Settings → Privacy & Security → "Open Anyway" after the
   first blocked attempt, or hand them the `xattr -dr` command. Free, but it's
   a support burden and a trust hit for a public download page.
3. **Ship a first-run helper that strips quarantine itself** (e.g. an
   installer `.pkg` with a postinstall script, since `.pkg` postinstall
   scripts run outside the quarantine sandbox that blocks the `.app` itself).
   Avoids needing a paid cert but is more build-pipeline work than option 1
   and is still somewhat unusual for end users to trust/run.

No decision has been made yet on which of these to pursue — that's the next
thing to align on. Whatever is decided, the download page at
<https://playsmallworlds.com/download/mac/> currently tells players that
removing quarantine is enough. It is not (see the correction box above) and
needs updating once the rebuilt DMG (with the RESOLVED #1 fix) is live.

---

## Original one-line summary (superseded, kept for history)

the macOS build is now correctly signed, but it still
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
| It was an architecture problem at all | It never was. The cause was Gatekeeper quarantine — see the box at the top |

The methodological lesson, offered honestly: `uname -m` should have been
obtained in the first five minutes, and quarantine should have been eliminated
before any theory about architecture. The failure mode actively misleads —
macOS reports an architecture error for a security refusal — so check the cheap,
non-obvious cause first:

```sh
xattr -l /Applications/SmallWorlds.app     # is com.apple.quarantine present?
codesign -dv /Applications/SmallWorlds.app # is it signed at all?
uname -m                                   # only then, architecture
```

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
