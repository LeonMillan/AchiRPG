//=============================================================================
// ArchiRPG Connect plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Adds form to connect to Archipelago on game startup.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 * 
 * @param bannerImg
 * @text Banner image
 * @desc Image displayed above the connection form.
 * put at img/archirpg.
 * @default 
 * @dir img/archirpg/
 * @type file
 */

(function () {
    'use strict';

    const {
      PluginManager,
      Scene_Boot
    } = window;
    const {
      bannerImg
    } = PluginManager.parameters("ArchiRPG_Connect");
    const __Scene_Boot__isReady = Scene_Boot.prototype.isReady;
    Scene_Boot.prototype.isReady = function () {
      if (ArchiRPG.client.status !== "Connected") return false;
      return __Scene_Boot__isReady.call(this);
    };
    const __Input__shouldPreventDefault = Input._shouldPreventDefault;
    Input._shouldPreventDefault = function () {
      if (ArchiRPG.client.status !== "Connected") return false;
      return __Input__shouldPreventDefault.call(this);
    };
    function makeConnectForm() {
      const container = document.createElement('div');
      container.id = 'archi-connect';
      container.innerHTML = `
    <table id="archi-connect-form">
        <tr>
            <td colspan="2">
                <img id="archi-banner-image" src="./img/archirpg/${bannerImg}.png" alt="ArchiRPG" />
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div id="archi-connect-error">
                    Failed to connect, please verify and try again.
                </div>
            </td>
        </tr>
        <tr>
            <td><label>URL:</label></td>
            <td><input type="text" id="archi-connect-url-input" autofocus placeholder="hostname:12345" /></td>
        </tr>
        <tr>
            <td><label>Player name:</label></td>
            <td><input type="text" id="archi-connect-player-input" placeholder="Your slot" /></td>
        </tr>
        <tr>
            <td><label>Password:</label></td>
            <td><input type="text" id="archi-connect-password-input" placeholder="(Optional)" /></td>
        </tr>
        <tr>
            <td colspan="2">
                <button type="button" id="archi-connect-button">Connect</button>
            </td>
        </tr>
    </table>
    `;
      const form = container.querySelector('#archi-connect-form');
      const errorDiv = container.querySelector('#archi-connect-error');
      const playerNameInput = container.querySelector('#archi-connect-player-input');
      const urlInput = container.querySelector('#archi-connect-url-input');
      const passwordInput = container.querySelector('#archi-connect-password-input');
      const connectButton = container.querySelector('#archi-connect-button');
      errorDiv.style.display = 'none';
      function setDisabled(disabled) {
        playerNameInput.disabled = disabled;
        urlInput.disabled = disabled;
        passwordInput.disabled = disabled;
        connectButton.disabled = disabled;
      }
      const savedConnectionData = localStorage.getItem("ArchiRPG_ConnectData");
      if (savedConnectionData) {
        const connectionData = JSON.parse(savedConnectionData);
        playerNameInput.value = connectionData["playerName"];
        urlInput.value = connectionData["url"];
      }
      async function doConnect() {
        const [hostname, port] = urlInput.value.split(":");
        if (!hostname || Number.isNaN(Number(port))) {
          errorDiv.style.display = 'block';
          return;
        }
        setDisabled(true);
        errorDiv.style.display = 'none';
        const success = await ArchiRPG.API.connect(playerNameInput.value, hostname, Number(port), passwordInput.value);
        if (!success) {
          setDisabled(false);
          errorDiv.style.display = 'block';
          localStorage.removeItem("ArchiRPG_ConnectData");
        } else {
          container.style.display = 'none';
          localStorage.setItem("ArchiRPG_ConnectData", JSON.stringify({
            playerName: playerNameInput.value,
            url: urlInput.value
          }));
        }
      }
      form.addEventListener('keypress', evt => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          doConnect();
        }
      });
      connectButton.addEventListener('click', async () => {
        doConnect();
      });
      return container;
    }
    function makeConnectStyling() {
      const styling = document.createElement('style');
      styling.innerHTML = `
        #archi-connect {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            background: rgba(0,0,0, 0.8);
            z-index: 99;
        }
        #archi-banner-image {
            width: auto;
            max-height: 50vh;
        }
        #archi-connect-error {
            padding: 8px;
            color: #FFFFFF;
            background: #880000;
        }
        label {
            margin-right: 2em;
        }
    `;
      return styling;
    }
    window.addEventListener('load', () => {
      document.body.appendChild(makeConnectStyling());
      document.body.appendChild(makeConnectForm());
    });

})();
