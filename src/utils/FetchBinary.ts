export const FetchBinary = async (path) => {
    console.log('[FetchBinary]', path);

    try {
        const res = await fetch(path);
        if (!res.ok) {
            throw `Error getting file ${path} ${res.status}`;
        }

        return new Uint8Array(res.arrayBuffer());
    } catch (err) {
        console.error(err);
    }
};
