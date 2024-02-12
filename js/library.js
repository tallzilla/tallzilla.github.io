const Params = {};

Params.getUrlParameters = function() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params = {};

    for (const [key, value] of urlParams) {
        params[key] = value;
    }

    return params;
};

