import { globals } from '../utils/window.js'
import { registerMethods } from '../utils/methods.js'
import Animator from './Animator.js'
import EventTarget from '../types/EventTarget.js'

const makeSchedule = function (runnerInfo) {
  const start = runnerInfo.start
  const duration = runnerInfo.runner.duration()
  const end = start + duration
  return {
    start: start,
    duration: duration,
    end: end,
    runner: runnerInfo.runner
  }
}

const defaultSource = function () {
  const w = globals.window
  return (w.performance || w.Date).now()
}

export default class Timeline extends EventTarget {
  // Construct a new timeline on the given element
  constructor(timeSource = defaultSource) {
    super()

    this._timeSource = timeSource

    // terminate resets all variables to their initial state
    this.terminate()
  }

  active() {
    return !!this._nextFrame
  }

  finish() {
    // Go to end and pause
    this.time(this.getEndTimeOfTimeline() + 1)
    return this.pause()
  }

  // Calculates the end of the timeline
  getEndTime() {
    const lastRunnerInfo = this.getLastRunnerInfo()
    const lastDuration = lastRunnerInfo ? lastRunnerInfo.runner.duration() : 0
    const lastStartTime = lastRunnerInfo ? lastRunnerInfo.start : this._time
    return lastStartTime + lastDuration
  }

  getEndTimeOfTimeline() {
    const endTimes = this._runners.map((i) => i.start + i.runner.duration())
    return Math.max(0, ...endTimes)
  }

  getLastRunnerInfo() {
    return this.getRunnerInfoById(this._lastRunnerId)
  }

  getRunnerInfoById(id) {
    return this._runners[this._runnerIds.indexOf(id)] || null
  }

  pause() {
    this._paused = true
    return this._continue()
  }

  persist(dtOrForever) {
    if (dtOrForever == null) return this._persist
    this._persist = dtOrForever
    return this
  }

  play() {
    // Now make sure we are not paused and continue the animation
    this._paused = false
    return this.updateTime()._continue()
  }

  reverse(yes) {
    const currentSpeed = this.speed()
    if (yes == null) return this.speed(-currentSpeed)

    const positive = Math.abs(currentSpeed)
    return this.speed(yes ? -positive : positive)
  }

  // schedules a runner on the timeline
  schedule(runner, delay, when) {
    if (runner == null) {
      return this._runners.map(makeSchedule)
    }

    // The start time for the next animation can either be given explicitly,
    // derived from the current timeline time or it can be relative to the
    // last start time to chain animations directly

    let absoluteStartTime = 0
    const endTime = this.getEndTime()
    delay = delay || 0

    // Work out when to start the animation
    if (when == null || when === 'last' || when === 'after') {
      // Take the last time and increment
      absoluteStartTime = endTime
    } else if (when === 'absolute' || when === 'start') {
      absoluteStartTime = delay
      delay = 0
    } else if (when === 'now') {
      absoluteStartTime = this._time
    } else if (when === 'relative') {
      const runnerInfo = this.getRunnerInfoById(runner.id)
      if (runnerInfo) {
        absoluteStartTime = runnerInfo.start + delay
        delay = 0
      }
    } else if (when === 'with-last') {
      const lastRunnerInfo = this.getLastRunnerInfo()
      const lastStartTime = lastRunnerInfo ? lastRunnerInfo.start : this._time
      absoluteStartTime = lastStartTime
    } else {
      throw new Error('Invalid value for the "when" parameter')
    }

    // Manage runner
    runner.unschedule()
    runner.timeline(this)

    const persist = runner.persist()
    const runnerInfo = {
      persist: persist === null ? this._persist : persist,
      start: absoluteStartTime + delay,
      runner
    }

    this._lastRunnerId = runner.id

    this._runners.push(runnerInfo)
    this._runners.sort((a, b) => a.start - b.start)
    this._runnerIds = this._runners.map((info) => info.runner.id)

    this.updateTime()._continue()
    return this
  }

  seek(dt) {
    return this.time(this._time + dt)
  }

  source(fn) {
    if (fn == null) return this._timeSource
    this._timeSource = fn
    return this
  }

  speed(speed) {
    if (speed == null) return this._speed
    this._speed = speed
    return this
  }

  stop() {
    // Go to start and pause
    this.time(0)
    return this.pause()
  }

  time(time) {
    if (time == null) return this._time
    this._time = time
    return this._continue(true)
  }

  // Remove the runner from this timeline
  unschedule(runner) {
    const index = this._runnerIds.indexOf(runner.id)
    if (index < 0) return this

    this._runners.splice(index, 1)
    this._runnerIds.splice(index, 1)

    runner.timeline(null)
    return this
  }

  // Makes sure, that after pausing the time doesn't jump
  updateTime() {
    if (!this.active()) {
      this._lastSourceTime = this._timeSource()
    }
    return this
  }

  // Checks if we are running and continues the animation
  _continue(immediateStep = false) {
    Animator.cancelFrame(this._nextFrame)
    this._nextFrame = null

    if (immediateStep) return this._stepImmediate()
    if (this._paused) return this

    this._nextFrame = Animator.frame(this._step)
    return this
  }

  _stepFn(immediateStep = false) {
    // Get the time delta from the last time and update the time
    const time = this._timeSource()
    let dtSource = time - this._lastSourceTime

    if (immediateStep) dtSource = 0

    const dtTime = this._speed * dtSource + (this._time - this._lastStepTime)
    this._lastSourceTime = time

    // Only update the time if we use the timeSource.
    // Otherwise use the current time
    if (!immediateStep) {
      // Update the time
      this._time += dtTime
      this._time = this._time < 0 ? 0 : this._time
    }
    this._lastStepTime = this._time
    this.fire('time', this._time)

    // This is for the case that the timeline was seeked so that the time
    // is now before the startTime of the runner. That is why we need to set
    // the runner to position 0

    // FIXME:
    // However, resetting in insertion order leads to bugs. Considering the case,
    // where 2 runners change the same attribute but in different times,
    // resetting both of them will lead to the case where the later defined
    // runner always wins the reset even if the other runner started earlier
    // and therefore should win the attribute battle
    // this can be solved by resetting them backwards
    for (let k = this._runners.length; k--; ) {
      // Get and run the current runner and ignore it if its inactive
      const runnerInfo = this._runners[k]
      const runner = runnerInfo.runner

      // Make sure that we give the actual difference
      // between runner start time and now
      const dtToStart = this._time - runnerInfo.start

      // Dont run runner if not started yet
      // and try to reset it
      if (dtToStart <= 0) {
        runner.reset()
      }
    }

    // Run all of the runners directly
    let runnersLeft = false
    for (let i = 0, len = this._runners.length; i < len; i++) {
      // Get and run the current runner and ignore it if its inactive
      const runnerInfo = this._runners[i]
      const runner = runnerInfo.runner
      let dt = dtTime

      // Make sure that we give the actual difference
      // between runner start time and now
      const dtToStart = this._time - runnerInfo.start

      // Dont run runner if not started yet
      if (dtToStart <= 0) {
        runnersLeft = true
        continue
      } else if (dtToStart < dt) {
        // Adjust dt to make sure that animation is on point
        dt = dtToStart
      }

      if (!runner.active()) continue

      // If this runner is still going, signal that we need another animation
      // frame, otherwise, remove the completed runner
      const finished = runner.step(dt).done
      if (!finished) {
        runnersLeft = true
        // continue
      } else if (runnerInfo.persist !== true) {
        // runner is finished. And runner might get removed
        const endTime = runner.duration() - runner.time() + this._time

        if (endTime + runnerInfo.persist < this._time) {
          // Delete runner and correct index
          runner.unschedule()
          --i
          --len
        }
      }
    }

    // Basically: we continue when there are runners right from us in time
    // when -->, and when runners are left from us when <--
    if (
      (runnersLeft && !(this._speed < 0 && this._time === 0)) ||
      (this._runnerIds.length && this._speed < 0 && this._time > 0)
    ) {
      this._continue()
    } else {
      this.pause()
      this.fire('finished')
    }

    return this
  }

  terminate() {
    // cleanup memory

    // Store the timing variables
    this._startTime = 0
    this._speed = 1.0

    // Determines how long a runner is hold in memory. Can be a dt or true/false
    this._persist = 0

    // Keep track of the running animations and their starting parameters
    this._nextFrame = null
    this._paused = true
    this._runners = []
    this._runnerIds = []
    this._lastRunnerId = -1
    this._time = 0
    this._lastSourceTime = 0
    this._lastStepTime = 0

    // Make sure that step is always called in class context
    this._step = this._stepFn.bind(this, false)
    this._stepImmediate = this._stepFn.bind(this, true)
  }
}

registerMethods({
  Element: {
    timeline: function (timeline) {
      if (timeline == null) {
        this._timeline = this._timeline || new Timeline()
        return this._timeline
      } else {
        this._timeline = timeline
        return this
      }
    }
  }
})
