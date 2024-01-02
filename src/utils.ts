
export function isDebugMode() {
    return process.env.NODE_ENV === 'development'
        || window.location.href.includes('localhost')
        || window.location.href.includes('debug=true')
    ;
}

