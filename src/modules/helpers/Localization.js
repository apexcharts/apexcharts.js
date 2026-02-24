import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'

import en from '../../locales/en.json'

export default class Localization {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  setCurrentLocaleValues(localeName) {
    let locales = this.w.config.chart.locales

    // check if user has specified locales in global Apex variable
    // if yes - then extend those with local chart's locale
    const globalApex = Environment.getApex()
    if (
      globalApex.chart &&
      globalApex.chart.locales &&
      globalApex.chart.locales.length > 0
    ) {
      locales = this.w.config.chart.locales.concat(globalApex.chart.locales)
    }

    // find the locale from the array of locales which user has set (either by chart.defaultLocale or by calling setLocale() method.)
    const selectedLocale = locales.filter((c) => c.name === localeName)[0]

    if (selectedLocale) {
      // create a complete locale object by extending defaults so you don't get undefined errors.
      let ret = Utils.extend(en, selectedLocale)

      // store these locale options in global var for ease access
      this.w.globals.locale = ret.options
    } else {
      throw new Error(
        'Wrong locale name provided. Please make sure you set the correct locale name in options'
      )
    }
  }
}
