// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {promises as fs} from 'fs'
import * as path from 'path'
import {exec} from 'child_process'
import {promisify} from 'util'
import * as zlib from 'zlib'

import glob from 'glob'
import winston from 'winston'

// Promisified functions
const execAsync = promisify(exec)
const globAsync = promisify(glob)
const gzipAsync = promisify(zlib.gzip)
const brotliCompressAsync = promisify(zlib.brotliCompress)

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message}) =>
            `${timestamp} [${level.toUpperCase()}] ${message}`,
        ),
    ),
    transports: [new winston.transports.Console()],
})

// Compression options interface
interface CompressionOptions {
    gzipOptions?: zlib.ZlibOptions // Options for Gzip compression
    brotliOptions?: zlib.BrotliOptions // Options for Brotli compression
    zstdOptions?: string // CLI options for Zstd compression
}

/**
 * Compresses the provided data using Gzip and Brotli algorithms.
 * @param data - The input Buffer.
 * @param filePath - Original file path for logging purposes.
 * @param options - Compression options.
 */
async function compressWithGzipAndBrotli(
    data: Buffer,
    filePath: string,
    options?: CompressionOptions,
): Promise<void> {
    try {
        const gzip = await gzipAsync(data, options?.gzipOptions)
        await fs.writeFile(`${filePath}.gz`, gzip)

        const brotli = await brotliCompressAsync(data, options?.brotliOptions)
        await fs.writeFile(`${filePath}.br`, brotli)

        logger.info(`Compressed (Gzip + Brotli): ${filePath}`)
    } catch (error) {
        logger.error(`Compression failed (.gz/.br): ${filePath} - ${(error as Error).message}`)
    }
}

/**
 * Compresses the file using Zstd via the CLI.
 * @param filePath - The path of the file to compress.
 * @param options - Compression options for Zstd.
 */
async function compressWithZstd(
    filePath: string,
    options?: CompressionOptions,
): Promise<void> {
    try {
        const extraOptions = options?.zstdOptions ?? ''
        const cmd = `zstd -f -q ${extraOptions} "${filePath}" -o "${filePath}.zst"`
        await execAsync(cmd)
        logger.info(`Compressed (Zstd): ${filePath}`)
    } catch (error) {
        logger.error(`Zstd compression failed: ${filePath} - ${(error as Error).message}`)
    }
}

/**
 * Reads and compresses the file using both compression methods.
 * @param filePath - The path of the file to compress.
 * @param options - Compression options.
 */
async function compressFile(
    filePath: string,
    options?: CompressionOptions,
): Promise<void> {
    try {
        const data = await fs.readFile(filePath)
        await Promise.all([
            compressWithGzipAndBrotli(data, filePath, options),
            compressWithZstd(filePath, options),
        ])
    } catch (error) {
        logger.error(`Failed to process file: ${filePath} - ${(error as Error).message}`)
    }
}

/**
 * Finds and compresses all assets matching the provided glob pattern.
 * @param globPattern - Glob pattern to match files.
 * @param options - Compression options.
 */
async function compressAssets(
    globPattern: string,
    options?: CompressionOptions,
): Promise<void> {
    try {
        const files: string[] = await globAsync(globPattern, {nodir: true})
        const assets = files.filter((file) => (/\.(js|css|html|eot|tiff|svg|woff2|woff|ttf)$/).test(file))
        logger.info(`Found ${assets.length} asset(s) to compress.`)
        await Promise.all(assets.map((file) => compressFile(file, options)))
    } catch (error) {
        logger.error(`Asset compression error: ${(error as Error).message}`)
        throw error
    }
}

// Default compression options; adjust as required.
const defaultCompressionOptions: CompressionOptions = {
    gzipOptions: {level: 9},
    brotliOptions: {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 11}},
    zstdOptions: '-22',
};

// Entry point
(async () => {
    try {
        const outputDir = path.resolve(__dirname, 'pack', 'static')
        const pattern = path.join(outputDir, '**', '*')
        await compressAssets(pattern, defaultCompressionOptions)
    } catch (error) {
        logger.error(`Unexpected error: ${(error as Error).message}`)
        throw error
    }
})()
