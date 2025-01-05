// Dependencies
import parsePath from "parse-path";
import normalizeUrl from "normalize-url";

/**
 * parseUrl
 * Parses the input url.
 *
 * **Note**: This *throws* if invalid urls are provided.
 *
 * @name parseUrl
 * @function
 * @param {String} url The input url.
 * @param {Boolean|Object} normalize Whether to normalize the url or not.
 *                         Default is `false`. If `true`, the url will
 *                         be normalized. If an object, it will be the
 *                         options object sent to [`normalize-url`](https://github.com/sindresorhus/normalize-url).
 *
 *                         For SSH urls, normalize won't work.
 *
 * @return {Object} An object containing the following fields:
 *
 *    - `protocols` (Array): An array with the url protocols (usually it has one element).
 *    - `protocol` (String): The first protocol, `"ssh"` (if the url is a ssh url) or `"file"`.
 *    - `port` (null|Number): The domain port.
 *    - `resource` (String): The url domain (including subdomains).
 *    - `user` (String): The authentication user (usually for ssh urls).
 *    - `pathname` (String): The url pathname.
 *    - `hash` (String): The url hash.
 *    - `search` (String): The url querystring value.
 *    - `href` (String): The input url.
 *    - `query` (Object): The url querystring, parsed as object.
 *    - `parse_failed` (Boolean): Whether the parsing failed or not.
 */
const parseUrl = (url, normalize = false) => {

    // Constants
    const GIT_RE = /^(?:([a-z_][a-z0-9_-]{0,31})@|https?:\/\/)([\w\.\-@]+)[\/:]([\~,\.\w,\-,\_,\/]+?(?:\.git|\/)?)$/

    const throwErr = msg => {
        const err = new Error(msg)
        err.subject_url = url
        throw err
    }

    if (typeof url !== "string" || !url.trim()) {
        throwErr("Invalid url.")
    }

    if (url.length > parseUrl.MAX_INPUT_LENGTH) {
        throwErr("Input exceeds maximum length. If needed, change the value of parseUrl.MAX_INPUT_LENGTH.")
    }

    if (normalize) {
        if (typeof normalize !== "object") {
            normalize = {
                stripHash: false
            }
        }
        url = normalizeUrl(url, normalize)
    }

    const parsed = parsePath(url)

    // Potential git-ssh urls
    if (parsed.parse_failed) {
        const matched = parsed.href.match(GIT_RE)

        if (matched) {
            parsed.protocols = ["ssh"]
            parsed.protocol = "ssh"
            parsed.resource = matched[2]
            parsed.host = matched[2]
            parsed.user = matched[1]
            parsed.pathname = `/${matched[3]}`
            parsed.parse_failed = false
        } else {
            throwErr("URL parsing failed.")
        }
    }

    return parsed;
}

parseUrl.MAX_INPUT_LENGTH = 2048

export default parseUrl;
