Josh Muir - Securing Digital Legacies - March 2024.

# Securing Digital Legacies
This repository contains the source code for the application I wrote for my Senior Honours Dissertation which I completed at the University of St Andrews in 2023-2024.
It communicates with a "cloud provider" backup server which I am keeping closed source at present.
I hope to clean things up and make it a bit more usable.

For the full technical details and rationale for this project, see [my dissertation](https://legacies.josh.scot/securing-digital-legacies.pdf).


## Abstract
Digital legacy and what happens to our data after death are becoming a growing concern.
This project examines the current state of the art and law surrounding this topic from a privacy perspective and proposes a new solution to pass on digital assets using a digital vault.
A digital vault contains data and can be shared with a number of recipients through a threshold secret sharing scheme, where some recipients must cooperate to access the data.
The project includes a user study to evaluate the project's success and identify areas for future work.
I found that the majority of users found the application easy to use and would use a similar application to manage their digital legacy in the future.
This shows the growing need for a legacy solution suited to the digital age that is platform-independent, secure and privacy focused.


## Building
All required dependencies are installed on lab machines.
```bash
npm install
npm run tauri build
```
The output can then be found in `application/src-tauri/target/relase`.

Dependencies for Arch are:
- Rust 1.73.0 or later.
- webkit2gtk4.0-devel
- openssl-devel
- curl
- wget
- file
- libappindicator-gtk3-devel
- librsvg2-devel
- C Development Tools and Libraries


## File overview
This overview will focus on the more key/interesting files.

- `public/` - Contains assets used outside the main application. The loading screen and loading icon are there.
- `src/` - Contains the React and Typescript code for the frontend/user interface.
  - `assets/` Contains static assets used such as sass for styling and fonts.
  - `pages/` Contains the main page flow components.
    - `welcome.tsx` The home page that has buttons to navigate to Creation/open/unlock.
    - `creation/` Contains React components for vault creation and updates.
    - `open/` Contains React components to open a vault using the main key.
    - `unlock/` Contains React components to unlock a vault using key pieces.
  - `shared/` Contains components used in multiple pages or locations, i.e. Headers, error handlers and the progress indicator.
  - `util/` Contains utility functions - no components.
  - `app.tsx` Main mount point for the application.
- `src-tauri/` Contains the Rust logic and core commands used to manage vaults
  - `tauri.conf.json` Contains configuration for Tauri such as enabled features, application name etc.
  - `icons/` Contains app icons. The blob used is randomly generated.
  - `src/` Contains Rust code
    - `commands/` Contains the commands - Which are hooks that can be called from the frontend to run rust code.
    - `crypto.rs` Handles all of the cryptography including key splitting, key generation etc.
    - `vault.rs` Contains types/structs for the vault and its various fields.
