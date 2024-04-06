//=============================================================================
// ArchiRPG plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Archipelago support for RPG Maker MV and MZ
 * @author LeonMillan
 * @orderAfter ArchiLib
 * 
 * 
 * @command startGame
 * @text Start Game
 * @desc Triggers a "game started" event.
 * This changes the client status to "Playing".
 *
 * 
 * @command locationScout
 * @text Location scout
 * @desc Gathers information about a location.
 * The fetched data is saved into ArchiRPG.knownLocations[locationId].
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 
 *
 * 
 * @command locationCheck
 * @text Location check
 * @desc Unlocks a location, sending the containing item to its owner.
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 
 * 
 * 
 * @command goalCheck
 * @text Goal check (WIP)
 * @desc Marks a goal requirement as completed.
 * Warning: work in progress, subject to change!
 *
 * @arg goal
 * @text Goal Type
 * @desc Which goal condition has been completed
 * @type select
 * @option Troop Defeated
 * @value troop
 * @option Map Visited
 * @value map
 * @default troop
 * 
 * @arg preventCompletion
 * @text Prevent automatic completion?
 * @desc Whether to mark the game as completed and
 * unlock all locations if all goal conditions were met.
 * @type boolean
 * @on Yes
 * @off No
 * @default false
 *
 * 
 * @command completeGame
 * @text Complete Game
 * @desc Triggers a "game completed" event.
 * This unlocks all locations automatically.
 *
 * 
 * @command showCustomMessage
 * @text Show Custom Message
 * @desc Displays a custom message in the ArchiRPG notification system.
 *
 * @arg message
 * @text Message
 * @desc Message text (supports control characters)
 * @type multiline_string
 * @default 
 * 
 * 
 * @command autopatchCheck
 * @text Autopatch Location Check
 * @desc Unlocks a location, changing the event automatically to prevent
 * commands associated with acquiring items from running,
 * such as Show Text, Change Items, Change Party Member, etc...
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 0
 * 
 * 
 * @command autopatchShop
 * @text Autopatch Shop
 * @desc Patches a shop processing command, changing the available goods.
 *
 * 
 * @param _World
 * @text AP World Settings
 * 
 * @param GameName
 * @text Game Name
 * @parent _World
 * @type text
 * 
 * @param BaseID
 * @text Base ID
 * @parent _World
 * @type number
 * 
 * @param EnableSaveBinding
 * @text Enable Save Binding
 * @desc When enabled, player can only load files
 * created for the current Archipelago room
 * @type boolean
 * @default true
 * 
 * 
 * @help
 * Note: When used in RPG Maker MV, plugin commands are prefixed with "ArchiRPG."
 * E.g., "ArchiRPG.startGame", "ArchiRPG.locationCheck My_Location", etc.
 * 
 * [Copyright]
 * This plugin uses "Archipelago.js" by ThePhar (Zach Parks).
 * https://github.com/ThePhar/Archipelago.JS
 *
 * [License]
 * This plugin is released under MIT license.
 * http://opensource.org/licenses/mit-license.php
 */