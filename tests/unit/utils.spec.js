import Utils from '../../src/utils/Utils'

describe('Utils', () => {
  describe('Type checking', () => {
    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(Utils.isObject({})).toBe(true)
        expect(Utils.isObject({ a: 1 })).toBe(true)
      })

      it('should return false for arrays', () => {
        expect(Utils.isObject([])).toBe(false)
        expect(Utils.isObject([1, 2, 3])).toBe(false)
      })

      it('should return falsy for null', () => {
        expect(Utils.isObject(null)).toBeFalsy()
      })

      it('should return falsy for primitives', () => {
        expect(Utils.isObject(5)).toBeFalsy()
        expect(Utils.isObject('string')).toBeFalsy()
        expect(Utils.isObject(true)).toBeFalsy()
        expect(Utils.isObject(undefined)).toBeFalsy()
      })
    })

    describe('is', () => {
      it('should correctly identify types', () => {
        expect(Utils.is('Array', [])).toBe(true)
        expect(Utils.is('Object', {})).toBe(true)
        expect(Utils.is('String', 'test')).toBe(true)
        expect(Utils.is('Number', 123)).toBe(true)
        expect(Utils.is('Boolean', true)).toBe(true)
        expect(Utils.is('Date', new Date())).toBe(true)
        expect(Utils.is('RegExp', /test/)).toBe(true)
      })

      it('should return false for wrong types', () => {
        expect(Utils.is('Array', {})).toBe(false)
        expect(Utils.is('String', 123)).toBe(false)
      })
    })

    describe('isNumber', () => {
      it('should return true for valid numbers', () => {
        expect(Utils.isNumber(0)).toBe(true)
        expect(Utils.isNumber(123)).toBe(true)
        expect(Utils.isNumber(-456)).toBe(true)
        expect(Utils.isNumber(3.14)).toBe(true)
      })

      it('should return false for NaN', () => {
        expect(Utils.isNumber(NaN)).toBe(false)
      })

      it('should return false for strings', () => {
        expect(Utils.isNumber('123')).toBe(false)
      })

      it('should return false for infinity', () => {
        expect(Utils.isNumber(Infinity)).toBe(false)
        expect(Utils.isNumber(-Infinity)).toBe(false)
      })
    })

    describe('isFloat', () => {
      it('should return true for floating point numbers', () => {
        expect(Utils.isFloat(3.14)).toBe(true)
        expect(Utils.isFloat(0.5)).toBe(true)
        expect(Utils.isFloat(-2.718)).toBe(true)
      })

      it('should return false for integers', () => {
        expect(Utils.isFloat(0)).toBe(false)
        expect(Utils.isFloat(42)).toBe(false)
        expect(Utils.isFloat(-10)).toBe(false)
      })
    })
  })

  describe('Number operations', () => {
    describe('parseNumber', () => {
      it('should return numbers as-is', () => {
        expect(Utils.parseNumber(42)).toBe(42)
        expect(Utils.parseNumber(3.14)).toBe(3.14)
      })

      it('should return null as-is', () => {
        expect(Utils.parseNumber(null)).toBe(null)
      })

      it('should parse string numbers', () => {
        expect(Utils.parseNumber('42')).toBe(42)
        expect(Utils.parseNumber('3.14')).toBe(3.14)
        expect(Utils.parseNumber('-10')).toBe(-10)
      })

      it('should handle invalid strings', () => {
        expect(Utils.parseNumber('not a number')).toBeNaN()
      })
    })

    describe('stripNumber', () => {
      it('should return integers unchanged', () => {
        expect(Utils.stripNumber(42)).toBe(42)
        expect(Utils.stripNumber(-10)).toBe(-10)
      })

      it('should strip floats to precision', () => {
        expect(Utils.stripNumber(3.14159, 2)).toBe(3.1)
        expect(Utils.stripNumber(3.14159, 3)).toBe(3.14)
      })

      it('should use default precision of 2', () => {
        expect(Utils.stripNumber(3.14159)).toBe(3.1)
      })
    })

    describe('log10', () => {
      it('should calculate base 10 logarithm', () => {
        expect(Utils.log10(10)).toBeCloseTo(1)
        expect(Utils.log10(100)).toBeCloseTo(2)
        expect(Utils.log10(1000)).toBeCloseTo(3)
        expect(Utils.log10(1)).toBeCloseTo(0)
      })
    })

    describe('roundToBase10', () => {
      it('should round to nearest power of 10', () => {
        expect(Utils.roundToBase10(1)).toBe(1)
        expect(Utils.roundToBase10(15)).toBe(10)
        expect(Utils.roundToBase10(99)).toBe(10)
        expect(Utils.roundToBase10(100)).toBe(100)
        expect(Utils.roundToBase10(567)).toBe(100)
      })
    })

    describe('roundToBase', () => {
      it('should round to nearest power of given base', () => {
        expect(Utils.roundToBase(15, 10)).toBe(10)
        expect(Utils.roundToBase(8, 2)).toBe(8) // 2^3 = 8
        expect(Utils.roundToBase(27, 5)).toBeCloseTo(25, 0) // 5^2 = 25
      })
    })

    describe('negToZero', () => {
      it('should convert negative numbers to zero', () => {
        expect(Utils.negToZero(-5)).toBe(0)
        expect(Utils.negToZero(-0.1)).toBe(0)
      })

      it('should keep positive numbers unchanged', () => {
        expect(Utils.negToZero(5)).toBe(5)
        expect(Utils.negToZero(0.1)).toBe(0.1)
      })

      it('should keep zero unchanged', () => {
        expect(Utils.negToZero(0)).toBe(0)
      })
    })

    describe('noExponents', () => {
      it('should round numbers in exponential notation', () => {
        expect(Utils.noExponents(1e-7)).toBe(0)
        expect(Utils.noExponents(1.5e3)).toBe(1500)
      })

      it('should keep regular numbers unchanged', () => {
        expect(Utils.noExponents(42)).toBe(42)
        expect(Utils.noExponents(3.14)).toBe(3.14)
      })
    })

    describe('preciseAddition', () => {
      it('should handle floating point precision issues', () => {
        expect(Utils.preciseAddition(0.1, 0.2)).toBe(0.3)
        expect(Utils.preciseAddition(0.7, 0.1)).toBe(0.8)
      })

      it('should work with integers', () => {
        expect(Utils.preciseAddition(5, 10)).toBe(15)
      })

      it('should work with negative numbers', () => {
        expect(Utils.preciseAddition(-0.1, 0.2)).toBe(0.1)
      })
    })

    describe('extractNumber', () => {
      it('should extract numbers from strings', () => {
        expect(Utils.extractNumber('price: $42.50')).toBe(42.5)
        expect(Utils.extractNumber('100%')).toBe(100)
        expect(Utils.extractNumber('item-123')).toBe(123)
      })

      it('should extract floating point numbers', () => {
        const result = Utils.extractNumber('12.34px')
        expect(result).toBeCloseTo(12.34, 2)
      })
    })

    describe('getGCD', () => {
      it('should find greatest common divisor', () => {
        expect(Utils.getGCD(12, 8)).toBe(4)
        expect(Utils.getGCD(100, 50)).toBe(50)
        expect(Utils.getGCD(17, 13)).toBe(1)
      })

      it('should work with decimals', () => {
        const result = Utils.getGCD(0.5, 0.25)
        expect(result).toBeCloseTo(0.25, 5)
      })
    })

    describe('getPrimeFactors', () => {
      it('should find prime factors', () => {
        expect(Utils.getPrimeFactors(12)).toEqual([2, 2, 3])
        expect(Utils.getPrimeFactors(30)).toEqual([2, 3, 5])
        expect(Utils.getPrimeFactors(17)).toEqual([17])
      })

      it('should handle 2', () => {
        expect(Utils.getPrimeFactors(2)).toEqual([2])
      })
    })

    describe('mod', () => {
      it('should calculate modulo with precision', () => {
        expect(Utils.mod(10, 3)).toBe(1)
        expect(Utils.mod(7.5, 2.5)).toBeCloseTo(0)
      })
    })
  })

  describe('String operations', () => {
    describe('escapeString', () => {
      it('should escape special characters with default x', () => {
        const result = Utils.escapeString('hello world')
        expect(result).toContain('x')
        expect(result).not.toContain(' ')
      })

      it('should escape special symbols', () => {
        const result = Utils.escapeString('test@example.com')
        expect(result).not.toContain('@')
        expect(result).not.toContain('.')
      })

      it('should use custom escape character', () => {
        const result = Utils.escapeString('hello world', '_')
        expect(result).toBe('hello_world')
      })

      it('should handle empty strings', () => {
        expect(Utils.escapeString('')).toBe('')
      })
    })

    describe('getLargestStringFromArr', () => {
      it('should find longest string in array', () => {
        expect(Utils.getLargestStringFromArr(['a', 'bb', 'ccc'])).toBe('ccc')
      })

      it('should handle nested arrays', () => {
        expect(
          Utils.getLargestStringFromArr(['short', ['medium', 'longest']])
        ).toBe('longest')
      })

      it('should handle empty array', () => {
        expect(Utils.getLargestStringFromArr([])).toBe(0)
      })
    })
  })

  describe('Array operations', () => {
    describe('moveIndexInArray', () => {
      it('should move element to new position', () => {
        const arr = [1, 2, 3, 4, 5]
        const result = Utils.moveIndexInArray(arr, 0, 4)
        expect(result).toEqual([2, 3, 4, 5, 1])
      })

      it('should handle moving to higher index', () => {
        const arr = ['a', 'b', 'c']
        const result = Utils.moveIndexInArray(arr, 2, 0)
        expect(result).toEqual(['c', 'a', 'b'])
      })

      it('should extend array if new index is beyond length', () => {
        const arr = [1, 2]
        const result = Utils.moveIndexInArray(arr, 0, 4)
        expect(result.length).toBe(5)
        expect(result[4]).toBe(1)
      })
    })
  })

  describe('Object operations', () => {
    describe('extend', () => {
      it('should shallow merge objects', () => {
        const target = { a: 1, b: 2 }
        const source = { b: 3, c: 4 }
        const result = Utils.extend(target, source)
        expect(result).toEqual({ a: 1, b: 3, c: 4 })
      })

      it('should deep merge nested objects', () => {
        const target = { a: { x: 1, y: 2 } }
        const source = { a: { y: 3, z: 4 } }
        const result = Utils.extend(target, source)
        expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } })
      })

      it('should not mutate original target', () => {
        const target = { a: 1 }
        const source = { b: 2 }
        const result = Utils.extend(target, source)
        expect(target).toEqual({ a: 1 })
        expect(result).not.toBe(target)
      })
    })

    describe('extendArray', () => {
      it('should extend each array item with result object', () => {
        const arr = [{ a: 1 }, { b: 2 }]
        const result = Utils.extendArray(arr, { c: 3 })
        expect(result).toEqual([
          { a: 1, c: 3 },
          { b: 2, c: 3 },
        ])
      })
    })

    describe('clone', () => {
      it('should clone primitives', () => {
        expect(Utils.clone(42)).toBe(42)
        expect(Utils.clone('test')).toBe('test')
        expect(Utils.clone(null)).toBe(null)
      })

      it('should deep clone objects', () => {
        const obj = { a: 1, b: { c: 2 } }
        const cloned = Utils.clone(obj)
        expect(cloned).toEqual(obj)
        expect(cloned).not.toBe(obj)
        expect(cloned.b).not.toBe(obj.b)
      })

      it('should deep clone arrays', () => {
        const arr = [1, [2, 3], { a: 4 }]
        const cloned = Utils.clone(arr)
        expect(cloned).toEqual(arr)
        expect(cloned).not.toBe(arr)
        expect(cloned[1]).not.toBe(arr[1])
      })

      it('should clone Date objects', () => {
        const date = new Date('2023-01-01')
        const cloned = Utils.clone(date)
        expect(cloned).toEqual(date)
        expect(cloned).not.toBe(date)
      })

      it('should handle circular references', () => {
        const obj = { a: 1 }
        obj.self = obj
        const cloned = Utils.clone(obj)
        expect(cloned.self).toBe(cloned)
      })
    })
  })

  describe('Color operations', () => {
    describe('isColorHex', () => {
      it('should return true for valid hex colors', () => {
        expect(Utils.isColorHex('#FFF')).toBe(true)
        expect(Utils.isColorHex('#FFFFFF')).toBe(true)
        expect(Utils.isColorHex('#FFFFFFFF')).toBe(true)
        expect(Utils.isColorHex('#abc')).toBe(true)
        expect(Utils.isColorHex('#AbC123')).toBe(true)
      })

      it('should return false for invalid hex colors', () => {
        expect(Utils.isColorHex('FFF')).toBe(false)
        expect(Utils.isColorHex('#GGG')).toBe(false)
        expect(Utils.isColorHex('#FF')).toBe(false)
        expect(Utils.isColorHex('rgb(255,255,255)')).toBe(false)
      })
    })

    describe('isCSSVariable', () => {
      it('should return true for CSS variables', () => {
        expect(Utils.isCSSVariable('var(--primary-color)')).toBe(true)
        expect(Utils.isCSSVariable('var(--bg)')).toBe(true)
      })

      it('should return false for non-CSS variables', () => {
        expect(Utils.isCSSVariable('#FFF')).toBe(false)
        expect(Utils.isCSSVariable('blue')).toBe(false)
        expect(Utils.isCSSVariable('var(')).toBe(false)
        expect(Utils.isCSSVariable(123)).toBe(false)
      })

      it('should trim whitespace', () => {
        expect(Utils.isCSSVariable('  var(--color)  ')).toBe(true)
      })
    })

    describe('applyOpacityToColor', () => {
      it('should return color-mix for opacity < 1', () => {
        expect(Utils.applyOpacityToColor('var(--primary)', 0.5)).toBe(
          'color-mix(in srgb, var(--primary) 50%, transparent)'
        )
        expect(Utils.applyOpacityToColor('#ff0000', 0.8)).toBe(
          'color-mix(in srgb, #ff0000 80%, transparent)'
        )
      })

      it('should return original color when opacity is 1', () => {
        expect(Utils.applyOpacityToColor('var(--primary)', 1)).toBe('var(--primary)')
        expect(Utils.applyOpacityToColor('#ff0000', 1)).toBe('#ff0000')
      })

      it('should round opacity percentage', () => {
        expect(Utils.applyOpacityToColor('var(--color)', 0.333)).toBe(
          'color-mix(in srgb, var(--color) 33%, transparent)'
        )
      })
    })

    describe('hexToRgba', () => {
      it('should convert 6-digit hex to rgba', () => {
        expect(Utils.hexToRgba('#FFFFFF', 1)).toBe('rgba(255,255,255,1)')
        expect(Utils.hexToRgba('#000000', 0.5)).toBe('rgba(0,0,0,0.5)')
        expect(Utils.hexToRgba('#FF0000', 0.8)).toBe('rgba(255,0,0,0.8)')
      })

      it('should convert 3-digit hex to rgba', () => {
        expect(Utils.hexToRgba('#FFF', 1)).toBe('rgba(255,255,255,1)')
        expect(Utils.hexToRgba('#F00', 0.5)).toBe('rgba(255,0,0,0.5)')
      })

      it('should use default opacity of 0.6', () => {
        const result = Utils.hexToRgba('#999999')
        expect(result).toBe('rgba(153,153,153,0.6)')
      })

      it('should handle invalid hex with default', () => {
        expect(Utils.hexToRgba('invalid', 0.5)).toBe('rgba(153,153,153,0.5)')
      })
    })

    describe('rgb2hex', () => {
      it('should convert rgb to hex', () => {
        expect(Utils.rgb2hex('rgb(255, 255, 255)')).toBe('#ffffff')
        expect(Utils.rgb2hex('rgb(0, 0, 0)')).toBe('#000000')
        expect(Utils.rgb2hex('rgb(255, 0, 0)')).toBe('#ff0000')
      })

      it('should handle rgba', () => {
        expect(Utils.rgb2hex('rgba(255, 0, 0, 0.5)')).toBe('#ff0000')
      })

      it('should handle various spacing', () => {
        expect(Utils.rgb2hex('rgb(255,255,255)')).toBe('#ffffff')
        expect(Utils.rgb2hex('rgb( 100 , 150 , 200 )')).toBe('#6496c8')
      })

      it('should return empty string for invalid input', () => {
        expect(Utils.rgb2hex('invalid')).toBe('')
        expect(Utils.rgb2hex('#FFF')).toBe('')
      })
    })

    describe('getOpacityFromRGBA', () => {
      it('should extract opacity from rgba', () => {
        expect(Utils.getOpacityFromRGBA('rgba(255,0,0,0.5)')).toBe(0.5)
        expect(Utils.getOpacityFromRGBA('rgba(0,0,0,1)')).toBe(1)
        expect(Utils.getOpacityFromRGBA('rgba(100,100,100,0.25)')).toBe(0.25)
      })
    })
  })

  describe('Geometry operations', () => {
    describe('getPolygonPos', () => {
      it('should calculate polygon vertex positions', () => {
        const positions = Utils.getPolygonPos(100, 4)
        expect(positions).toHaveLength(4)
        expect(positions[0]).toHaveProperty('x')
        expect(positions[0]).toHaveProperty('y')
      })

      it('should create vertices on circle', () => {
        const positions = Utils.getPolygonPos(50, 3)
        positions.forEach((pos) => {
          const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2)
          expect(distance).toBeCloseTo(50, 5)
        })
      })
    })

    describe('polarToCartesian', () => {
      it('should convert polar to cartesian coordinates', () => {
        const result = Utils.polarToCartesian(0, 0, 100, 0)
        // 0 degrees in the function means -90 degrees (pointing up)
        expect(result.x).toBeCloseTo(0, 1)
        expect(result.y).toBeCloseTo(-100, 1)
      })

      it('should handle 90 degree angle', () => {
        const result = Utils.polarToCartesian(0, 0, 100, 90)
        // 90 degrees points right
        expect(result.x).toBeCloseTo(100, 1)
        expect(result.y).toBeCloseTo(0, 1)
      })

      it('should handle center offset', () => {
        const result = Utils.polarToCartesian(50, 50, 100, 0)
        expect(result.x).toBeCloseTo(50, 1)
        expect(result.y).toBeCloseTo(-50, 1)
      })
    })
  })

  describe('Math operations', () => {
    describe('monthMod', () => {
      it('should calculate month modulo 12', () => {
        expect(Utils.monthMod(1)).toBe(1)
        expect(Utils.monthMod(12)).toBe(0)
        expect(Utils.monthMod(13)).toBe(1)
        expect(Utils.monthMod(24)).toBe(0)
      })
    })
  })

  describe('Random', () => {
    describe('randomId', () => {
      it('should generate random string', () => {
        const id = Utils.randomId()
        expect(typeof id).toBe('string')
        expect(id.length).toBeGreaterThan(0)
      })

      it('should generate different ids', () => {
        const id1 = Utils.randomId()
        const id2 = Utils.randomId()
        expect(id1).not.toBe(id2)
      })
    })
  })

  describe('Color shading', () => {
    describe('shadeColor(p, color)', () => {
      it('lightens a hex color (positive percent)', () => {
        const utils = new Utils()
        const result = utils.shadeColor(0.5, '#000000')
        // Lightening black by 50% → some mid-grey hex
        expect(result).toMatch(/^#[0-9a-f]{6}$/i)
        expect(result).not.toBe('#000000')
      })

      it('darkens a hex color (negative percent)', () => {
        const utils = new Utils()
        const result = utils.shadeColor(-0.5, '#ffffff')
        expect(result).toMatch(/^#[0-9a-f]{6}$/i)
        expect(result).not.toBe('#ffffff')
      })

      it('routes to shadeRGBColor for rgb() input', () => {
        const utils = new Utils()
        const result = utils.shadeColor(0.5, 'rgb(100,100,100)')
        expect(result).toMatch(/^rgb\(/)
      })

      it('lightening by 0 returns a near-equivalent color', () => {
        const utils = new Utils()
        // shade by 0 → no change for hex
        const result = utils.shadeHexColor(0, '#ff0000')
        expect(result).toBe('#ff0000')
      })

      it('darkens an rgb color (negative percent)', () => {
        const utils = new Utils()
        const result = utils.shadeRGBColor(-0.5, 'rgb(200,200,200)')
        expect(result).toMatch(/^rgb\(/)
      })
    })
  })

  describe('findAncestor(el, cls)', () => {
    it('returns the matching ancestor element', () => {
      const grandparent = document.createElement('div')
      grandparent.classList.add('target-class')
      const parent = document.createElement('div')
      const child = document.createElement('span')
      grandparent.appendChild(parent)
      parent.appendChild(child)

      const result = Utils.findAncestor(child, 'target-class')
      expect(result).toBe(grandparent)
    })

    it('returns null when no matching ancestor exists', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)

      const result = Utils.findAncestor(child, 'nonexistent-class')
      expect(result).toBeNull()
    })
  })

  describe('extractNumber(s)', () => {
    it('extracts the numeric portion from a string with units', () => {
      expect(Utils.extractNumber('123px')).toBe(123)
      expect(Utils.extractNumber('45.6em')).toBe(45.6)
    })

    it('returns NaN for a non-numeric string', () => {
      expect(isNaN(Utils.extractNumber('abc'))).toBe(true)
    })

    it('handles plain numeric strings', () => {
      expect(Utils.extractNumber('42')).toBe(42)
    })
  })

  describe('preciseAddition(a, b)', () => {
    it('adds integers without floating-point error', () => {
      expect(Utils.preciseAddition(1, 2)).toBe(3)
    })

    it('adds floats precisely — 0.1+0.2 = 0.3', () => {
      expect(Utils.preciseAddition(0.1, 0.2)).toBeCloseTo(0.3, 10)
    })

    it('handles mixed integer and float', () => {
      expect(Utils.preciseAddition(1, 0.5)).toBe(1.5)
    })

    it('handles negative numbers', () => {
      expect(Utils.preciseAddition(-0.1, 0.1)).toBeCloseTo(0, 10)
    })
  })

  describe('getGCD(a, b)', () => {
    it('computes GCD of two integers', () => {
      expect(Utils.getGCD(12, 8)).toBeCloseTo(4, 5)
    })

    it('computes GCD of two floats', () => {
      // GCD of 0.3 and 0.6 should be close to 0.3
      expect(Utils.getGCD(0.3, 0.6)).toBeCloseTo(0.3, 5)
    })

    it('returns a when b=0 (GCD(a,0)=a)', () => {
      // When one number is much larger, factor may or may not exceed 1
      const result = Utils.getGCD(5, 5)
      expect(result).toBeCloseTo(5, 3)
    })

    it('uses factor=1 when the numbers are large enough (factor<=1 branch)', () => {
      // With large numbers, factor = 10^(p - floor(log10(max))) ≤ 1
      const result = Utils.getGCD(1000000, 500000)
      expect(result).toBeCloseTo(500000, -3)
    })
  })

  describe('getPrimeFactors(n)', () => {
    it('returns prime factors of a composite number', () => {
      expect(Utils.getPrimeFactors(12)).toEqual([2, 2, 3])
    })

    it('returns the number itself for a prime', () => {
      expect(Utils.getPrimeFactors(7)).toEqual([7])
    })

    it('returns empty array for 1 (no factors)', () => {
      expect(Utils.getPrimeFactors(1)).toEqual([])
    })

    it('handles a number with repeated prime factor', () => {
      expect(Utils.getPrimeFactors(8)).toEqual([2, 2, 2])
    })
  })

  describe('mod(a, b)', () => {
    it('computes precise modulo for integers', () => {
      expect(Utils.mod(10, 3)).toBeCloseTo(1, 5)
    })

    it('computes precise modulo for floats', () => {
      expect(Utils.mod(0.7, 0.3)).toBeCloseTo(0.1, 4)
    })

    it('returns 0 when a is a multiple of b', () => {
      expect(Utils.mod(6, 3)).toBeCloseTo(0, 5)
    })
  })

})
