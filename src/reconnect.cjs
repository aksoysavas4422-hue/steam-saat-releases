'use strict';
class Reconnect {
  constructor(attempt, changed, { clock = Date.now, schedule = setTimeout, clear = clearTimeout } = {}) {
    this.attempt = attempt; this.changed = changed;
    this.clock = clock; this.scheduleTimer = schedule; this.clearTimer = clear;
    this.timer = null; this.count = 0; this.nextAt = null; this.exhausted = false; this.epoch = 0;
  }
  snapshot() { return { count: this.count, nextAt: this.nextAt, exhausted: this.exhausted }; }
  schedule() {
    if (this.timer !== null) return;
    const waits = [5000, 10000, 20000, 40000, 60000, 120000, 120000, 120000];
    if (this.count >= waits.length) { this.exhausted = true; this.nextAt = null; this.changed(); return; }
    const wait = waits[this.count++]; const epoch = this.epoch;
    this.nextAt = this.clock() + wait;
    this.timer = this.scheduleTimer(async () => {
      this.timer = null; this.nextAt = null; this.changed();
      try { await this.attempt(); }
      catch { if (this.epoch === epoch) this.schedule(); }
    }, wait);
    this.timer?.unref?.(); this.changed();
  }
  cancel() {
    this.epoch++; if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null; this.nextAt = null; this.count = 0; this.exhausted = false; this.changed();
  }
}
module.exports = { Reconnect };
