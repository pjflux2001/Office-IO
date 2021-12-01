import Phaser from "phaser";
import MyPlayer from "./MyPlayer";
import { PlayerBehavior } from "../../../types/PlayerBehavior";
import Item from "../items/Item";

// loom sdk
import { isSupported, setup } from "@loomhq/loom-sdk";

// for env
const API_KEY = "17dee62d-9d46-4523-acc3-b7de86f6938f";
const BUTTON_ID = "loom-sdk-button";

// status arr
var status_map = new Map();

export default class PlayerSelector extends Phaser.GameObjects.Zone {
  selectedItem?: Item;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    super(scene, x, y, width, height);

    scene.physics.add.existing(this);
  }

  update(player: MyPlayer, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!cursors) {
      return;
    }

    // no need to update player selection while sitting
    if (player.playerBehavior === PlayerBehavior.SITTING) {
      return;
    }

    // loomSDK
    async function init() {
      const { supported, error } = await isSupported();
      if (!supported) {
        console.warn(`Error setting up Loom: ${error}`);
        return;
      }
      const root = document.getElementById("root");
      if (!root) {
        return;
      }
      root.innerHTML = `<buttton class = "button-grid" style="transform: translateX(20px);"> <button id="${BUTTON_ID}">Record Video Status</button> </div>`;
      const button = document.getElementById(BUTTON_ID);
      if (!button) {
        return;
      }
      const { configureButton } = await setup({
        apiKey: API_KEY,
      });
      const sdkButton = configureButton({
        element: button,
      });
      sdkButton.on("insert-click", async (video) => {
        status_map.set(player.playerId, video.embedUrl);
        let d_e = document.getElementsByClassName(
          "icon-button__badge"
        ) as HTMLCollectionOf<HTMLElement>;

        d_e[0].style.display = "block";
        d_e[0].innerText = "" + status_map.size;
      });
    }

    // update player selection box position so that it's always in front of the player
    const { x, y } = player;
    if (cursors.left?.isDown) {
      this.setPosition(x - 32, y);
    } else if (cursors.right?.isDown) {
      this.setPosition(x + 32, y);
    } else if (cursors.up?.isDown) {
      this.setPosition(x, y - 32);
    } else if (cursors.down?.isDown) {
      this.setPosition(x, y + 32);
    } else if (cursors.space?.isDown) {
      init();
    } else if (cursors.shift?.isDown) {
      if (status_map.size > 0) {
        status_map.forEach(function (value, key) {
          window.open(value, "_blank");
          status_map.delete(key);
        });
        let d_e = document.getElementsByClassName(
          "icon-button__badge"
        ) as HTMLCollectionOf<HTMLElement>;
        d_e[0].innerText = "";
        d_e[0].style.display = "none";
      }
    }

    // while currently selecting an item,
    // if the selector and selection item stop overlapping, clear the dialog box and selected item
    if (this.selectedItem) {
      if (!this.scene.physics.overlap(this, this.selectedItem)) {
        this.selectedItem.clearDialogBox();
        this.selectedItem = undefined;
      }
    }
  }
}
