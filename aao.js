// ==UserScript==
// @namespace         https://github.com/eleflea
// @name              NEU AAO Captcha filler
// @name:en           NEU AAO Captcha filler
// @name:zh           东北大学教务处验证码填充
// @name:zh-CN        东北大学教务处验证码填充
// @description       自动填充东北大学教务处验证码
// @description:en    Automatically fill the Northeastern University's aao website captcha
// @description:zh    自动填充东北大学教务处验证码
// @description:zh-CN 自动填充东北大学教务处验证码
// @include           *://aao.qianhao.aiursoft.com/*
// @include           *://202.118.31.197/*
// @include           *://aao.neu.edu.cn/*
// @supportURL        https://github.com/eleflea/neu_filler/
// @version           0.2.2
// @author            eleflea
// @grant             none
// ==/UserScript==

"use strict"
const aaoCaptcha = function (imgElement) {
    const token = {
        "*": "101111100011111010111",
        "+": "111101111000011111011",
        "1": "1011110000000011111111111111",
        "2": "1011100011101000101101111111",
        "3": "1011101011011010010001111111",
        "4": "1111011101101100000001111111",
        "5": "0000110010111001001101111111",
        "6": "1110001101011011100101111111",
        "7": "0111111011110001001110111111"
    }
    const box = [[7, 2, 17, 16], [19, 2, 27, 16], [33, 2, 43, 16]]

    function digit(box, threshold) {
        let min = 30
        let num = 0
        for (let i = 1; i < 8; i++) {
            let score = grayImg.compare(...box, token[i.toString()])
            if (score < threshold) {
                return i
            }
            if (score < min) {
                min = score
                num = i
            }
        }
        return num
    }

    function operator(box, threshold) {
        const scorePlus = grayImg.compare(...box, token["+"])
        const scoreMul = grayImg.compare(...box, token["*"])
        if (scoreMul > scorePlus) {
            return 0
        }
        return 1
    }

    function identify(threshold) {
        const num1 = digit(box[0], threshold)
        const num2 = digit(box[2], threshold)
        const op = operator(box[1], threshold)
        return op ? num1 * num2 : num1 + num2
    }

    function removeNoise() {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < height - 1; x++) {
                if (!grayImg.at(x, y) && grayImg.at(x - 1, y) && grayImg.at(x, y - 1) && grayImg.at(x + 1, y) && grayImg.at(x, y + 1)) {
                    grayImg.set(x, y, 1)
                }
            }
        }
    }

    // get imgData
    const canvasElement = document.createElement('canvas')
    const height = imgElement.height
    const width = imgElement.width
    canvasElement.height = height
    canvasElement.width = width
    const ctx = canvasElement.getContext('2d')
    ctx.drawImage(imgElement, 0, 0)
    const imgData = ctx.getImageData(0, 0, imgElement.width, imgElement.height).data
    // check imgData, alpha must be 255
    if (imgData[3] == 0) {
        return
    }

    // convert to gray level with 140 threshold
    let grayImgData = []
    for (let i = 0; i < 4 * height * width; i += 4) {
        let lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]
        grayImgData.push(lum > 140 ? 1 : 0)
    }

    // grayImg obj
    let grayImg = {
        width,
        height,
        grayImgData,
        at: function (x, y) {
            return this.grayImgData[x + this.width * y]
        },
        set: function (x, y, color) {
            this.grayImgData[x + this.width * y] = color
        },
        compare: function (x1, y1, x2, y2, template) {
            let score = 0
            let count = 0
            for (let x = x1; x < x2; x += 3) {
                for (let y = y1; y < y2; y += 2) {
                    score += (this.at(x, y) != template[count])
                    count++
                }
            }
            return score
        }
    }

    // remove noise and identify
    removeNoise()
    const result = identify(2)

    // set input element with the result
    document.getElementsByName('Agnomen')[0].value = result.toString()
}

// test existence first
const imgElement = document.querySelector('img[width="55"][height="20"]')
if (imgElement !== null) {
    // wait for captcha loaded
    aaoCaptcha(imgElement)
    imgElement.addEventListener("load", () => { aaoCaptcha(imgElement) })
}
