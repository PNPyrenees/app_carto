/**
 * @param {import("../../size.js").Size} size Canvas size in css pixels.
 * @param {Array<import("../../transform.js").Transform>} transforms Transforms
 * for rendering features to all worlds of the viewport, from coordinates to css
 * pixels.
 * @param {Array<import("../../Feature.js").FeatureLike>} features
 * Features to consider for hit detection.
 * @param {import("../../style/Style.js").StyleFunction|undefined} styleFunction
 * Layer style function.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @return {ImageData} Hit detection image data.
 */
export function createHitDetectionImageData(size: number[], transforms: number[][], features: (import("../Feature.js").default | import("../../Feature.js").default<any>)[], styleFunction: (arg0: import("../Feature.js").default | import("../../Feature.js").default<any>, arg1: number) => void | import("../../style/Style.js").default | import("../../style/Style.js").default[], extent: number[], resolution: number, rotation: number): ImageData;
/**
 * @param {import("../../pixel").Pixel} pixel Pixel coordinate on the hit
 * detection canvas in css pixels.
 * @param {Array<import("../../Feature").FeatureLike>} features Features. Has to
 * match the `features` array that was passed to `createHitDetectionImageData()`.
 * @param {ImageData} imageData Hit detection image data generated by
 * `createHitDetectionImageData()`.
 * @return {Array<import("../../Feature").FeatureLike>} features Features.
 */
export function hitDetect(pixel: number[], features: (import("../Feature.js").default | import("../../Feature.js").default<any>)[], imageData: ImageData): (import("../Feature.js").default | import("../../Feature.js").default<any>)[];
export const HIT_DETECT_RESOLUTION: 0.5;
//# sourceMappingURL=hitdetect.d.ts.map