import { register } from '../utils/adopter.js'
import Element from './Element.js'

export default class Shape extends Element {}

register(Shape, 'Shape')
