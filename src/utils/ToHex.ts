export const ToHex = (val: number) => {
    const hexa =
        val > 255
            ? (val >> 8).toString(16).padStart(2, '0') + (val & 0x00ff).toString(16).padStart(2, '0')
            : val.toString(16).padStart(4, '0');

    return hexa.toUpperCase();
};
