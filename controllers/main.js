module.exports = {
    canvasSaver: async (data, socket) => {
        const edgePaths = require("edge-paths");
        const EDGE_PATH = edgePaths.getEdgePath();
        const puppeteer = require('puppeteer-core')
        const fs = require('fs')
        let dataArray = []
        const setDelay = (time) => {
            return new Promise(function (resolve) {
                setTimeout(resolve, time * 1000)
            })
        }
        function isValidURL(url) {
            const res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
            return (res !== null)
        }

        const { url, delay } = data
        if (url === '') return socket.emit('data', { success: false, message: 'url cannot be empty' })
        if (delay <= 0) return socket.emit('data', { success: false, message: 'delay cannot be 0' })
        if (!isValidURL(url)) return socket.emit('data', { success: false, message: 'wrong url' })
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--start-maximized'
            ],
            executablePath: EDGE_PATH,
            defaultViewport: null,
            IgnoreHTTPSErrors: true,
            userDataDir: "./tmp",
            waitUntil: "networkidle2",
        })

        const getImage = async (page) => {
            const iframeContainers = await page.$$('.grid-item')
            await setDelay(delay)
            for (const iframeContainer of iframeContainers) {
                const iframe = await page.evaluate((el) => el.querySelector("iframe"), iframeContainer)
                if (iframe === null) return
                const title = await page.evaluate((el) => el.querySelector("div.product-title-1").textContent.trim(), iframeContainer)
                const frame = await (await iframeContainer.$('iframe')).contentFrame()
                const data = await frame.evaluate(async () => {
                    return document.querySelector('canvas').toDataURL()
                })
                dataArray.push({ dataURI: data, title: title })
                // fs.writeFile(`${title}.png`, data.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
                // fs.writeFile(`../downloads/${title}.png`, data.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
                //     if (err) return console.log(err)
                // })
            }
            return Promise.resolve(true)
        }
        try {
            const page = await browser.newPage()
            await page.goto(url, { waitUntil: 'load' })
            await getImage(page)
            await socket.emit('data', { success: true, data: dataArray })
            dataArray = []
        } catch (error) {
            console.log(error)
            await socket.emit('data', { success: false, message: error.message })
            await browser.close()
        } finally {
            const pages = await browser.pages();
            for (const page of pages) await page.close();
            await browser.close()
        }
    }
}
