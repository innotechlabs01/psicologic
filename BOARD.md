# Team Board

## TODO
- [ ] T-001: Fix iOS bundling error in MyTicketsScreen.tsx — duplicate type `Nav` declaration (line 32). Also investigate MembershipPlansListScreen.tsx unclosed TouchableOpacity.
- [ ] T-002: iOS dev build never installs → Expo Go fallback → `TypeError: fetch failed`. ROOT CAUSE: `expo-av@16.0.8` fails to compile on SDK 54 (`EXAV.h` imports removed `<ExpoModulesCore/EXEventEmitter.h>`). Fix: migrate 2 files to `expo-video`, drop `expo-av`, rebuild dev client with `expo run:ios`. (diagnosis by @coordinator)

> Note (2026-10-18, updated): T-001/T-002 reference an Expo/React Native app
> (MyTicketsScreen.tsx, MembershipPlansListScreen.tsx, expo-av). This repo has
> NO mobile app and none is planned — the tasks belong to a different project.
> Pending user confirmation to remove them from this board.

## In Progress

## Review

## Done