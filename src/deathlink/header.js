//=============================================================================
// ArchiRPG Deathlink plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Adds Deathlink support for games with ArchiRPG.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 * 
 * @param DeathlinkMode
 * @text Deathlink Mode
 * @type select
 * @default party
 * @option Disabled
 * @value none
 * @option Actor Death
 * @value actor
 * @option Party Defeat
 * @value party
 * @option Custom Event
 * @value custom
 * 
 * @param DeathlinkTrigger
 * @text Trigger
 * @desc When set to manual, you need to implement the Deathlink
 * trigger manually by calling ArchiRPG.API.triggerDeathlink()
 * @type select
 * @default auto
 * @option Automatic
 * @value auto
 * @option Manual
 * @value manual
 * 
 * @param DeathlinkActorPriority
 * @text Actor Priority
 * @desc When in "actor" mode, defines which actor is chosen to
 * be killed when a DeathLink event happens.
 * @type select
 * @default first
 * @option First in Party Order
 * @value first
 * @option Random (entire party)
 * @value random
 * @option Random (active in battle)
 * @value random_battle
 * 
 * @param DeathlinkEventID
 * @text Custom Common Event ID
 * @desc Common Event called when using the "custom" mode.
 * @type common_event
 * 
 * @param DeathlinkCauseEval
 * @text Death Cause Script
 * @desc JavaScript executed to determine the cause of a Deathlink.
 * See "Help" section for details.
 * @type note
 */
