//=============================================================================
// ArchiRPG Connect plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Adds form to connect to Archipelago on game startup.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 */

(function () {
    'use strict';

    const {
      Scene_Boot
    } = window;
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
                <div id="archi-connect-error">
                    Failed to connect, please verify and try again.
                </div>
            </td>
        </tr>
        <tr>
            <td><label>Player name:</label></td>
            <td><input type="text" id="archi-connect-player-input" /></td>
        </tr>
        <tr>
            <td><label>Hostname:</label></td>
            <td><input type="text" id="archi-connect-hostname-input" /></td>
        </tr>
        <tr>
            <td><label>Port:</label></td>
            <td><input type="text" id="archi-connect-port-input" /></td>
        </tr>
        <tr>
            <td colspan="2">
                <button type="button" id="archi-connect-button">Connect</button>
            </td>
        </tr>
    </table>
    `;
      const errorDiv = container.querySelector('#archi-connect-error');
      const playerNameInput = container.querySelector('#archi-connect-player-input');
      const hostnameInput = container.querySelector('#archi-connect-hostname-input');
      const portInput = container.querySelector('#archi-connect-port-input');
      const connectButton = container.querySelector('#archi-connect-button');
      errorDiv.style.display = 'none';
      function setDisabled(disabled) {
        playerNameInput.disabled = disabled;
        hostnameInput.disabled = disabled;
        portInput.disabled = disabled;
        connectButton.disabled = disabled;
      }
      connectButton.addEventListener('click', async () => {
        setDisabled(true);
        errorDiv.style.display = 'none';
        const success = await ArchiRPG.API.connect(playerNameInput.value, hostnameInput.value, Number(portInput.value), connectButton.value);
        if (!success) {
          setDisabled(false);
          errorDiv.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
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
