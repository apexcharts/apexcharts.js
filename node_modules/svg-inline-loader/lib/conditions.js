function isStartTag (tag) {
    return tag !== undefined && tag.type === 'StartTag';
}

function isSVGToken (tag) {
    return isStartTag(tag) && tag.tagName === 'svg';
}

function isStyleToken (tag) {
    return isStartTag(tag) && tag.tagName === 'style';
}

function isFilledObject (obj) {
    return obj != null &&
           typeof obj === 'object' &&
           Object.keys(obj).length !== 0;
}

function hasNoWidthHeight(attributeToken) {
    return attributeToken[0] !== 'width' && attributeToken[0] !== 'height';
}

function createHasNoAttributes(attributes) {
    return function hasNoAttributes(attributeToken) {
      return attributes.indexOf(attributeToken[0]) === -1;
    }
}

function createHasAttributes(attributes) {
    return function hasAttributes(attributeToken) {
        return attributes.indexOf(attributeToken[0]) > -1;
    }
}

module.exports = {
    isSVGToken: isSVGToken,
    isStyleToken: isStyleToken,
    isFilledObject: isFilledObject,
    hasNoWidthHeight: hasNoWidthHeight,
    createHasNoAttributes: createHasNoAttributes,
    createHasAttributes: createHasAttributes,
    isStartTag: isStartTag
};
