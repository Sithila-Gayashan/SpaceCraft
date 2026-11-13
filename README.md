# SpaceCraft
SpaceCraft is an offline-first Android and iOS room planner built with JavaScript and Expo SDK 58. It includes a local library of 33 furniture pieces across nine categories. All illustrations are drawn by bundled SVG components.

## Setup
Use Node 22.13+ on the 22.x line (or Node 24.3+ on the 24.x line) and npm. From the project directory run:

```sh
npm ci
npm start
```

Open the project in an SDK 58 compatible Expo Go client, or build a native client with `npx expo run:android` (Android Studio and Android SDK required) or `npx expo run:ios` (macOS and Xcode required). A development session needs a connection to Metro. For a standalone Android build with bundled JavaScript use `npx expo run:android --variant release`. Install dependencies and native build tools before disconnecting. In a standalone build the planner runs locally, including its fonts, illustrations and SQLite catalogue.

## Workflow
1. Create a room. Choose its unit, dimensions and floor colour. Specify wall openings by offset from the left or top.
2. Open the room and choose **Design a new layout**. Add pieces, drag on the grid and rotate the selected piece. The piece selector also reaches furniture hidden underneath another piece.
3. Check the space calculator and save the layout by name. A room can have multiple designs. Shared footprints are allowed and highlighted.
4. Use **Saved Layouts** to open, edit, duplicate or delete a design. Room deletion removes its openings and layouts. Default units for new rooms are stored in Settings.

## Architecture
- `src/database` owns the SQLite schema, transactional migration and catalogue seed, repository and React context. The database uses foreign keys, cascading deletes and parameter binding. Layout replacements and room edits run inside transactions. The schema revision is tracked with SQLite user_version.
- `src/services/geometry.js` holds the pure placement and analysis functions. All SQLite dimensions and positions use metres. The room unit controls input and display. Rectangles use top-left coordinates, clockwise quarter-turn rotations and rotated effective extents. Dragging snaps to 5 cm with exact wall clamping. The grid interval is 50 cm.
- Occupied area is the union of all floor rectangles. A sweep across sorted x edges merges intersecting y intervals for each strip. Edge contact alone does not mark a collision.
- `src/components` contains shared controls, the gesture-enabled SVG plan and category illustrations. `src/screens` implements dashboard, rooms, forms, catalogue, designer, calculator, saved layouts, details and settings. `src/navigation` combines five bottom tabs with a native stack.
- Undo and redo retain up to 50 edit steps for an open design session. Save commits the complete draft. The editor checks before discarding unsaved changes.

## Verification
```sh
npm test
npm run lint
npx expo install --check
npx expo export --platform android
```
The tests use Node's SQLite driver to exercise the same schema, seed and repository used by Expo. They cover room creation, editing and deletion, search, filters, order, placement, rotation, overlap, union area, rejected writes, duplication, cascade deletion and reopening the on-disk database.

For native acceptance testing, install a standalone build, create a room with openings, drag two pieces into overlap, rotate one, check the calculator, save and force-close. Enable airplane mode, relaunch, and verify the saved positions, catalogue and layout management. Repeat in feet and on a narrow screen.
