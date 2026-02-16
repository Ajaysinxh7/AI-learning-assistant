    /**
     * TEXT CHUNKER + RETRIEVER
     * Production-ready utility for AI pipelines (RAG, quiz generation, semantic search)
     */

    /* ---------------- STOP WORDS ---------------- */

    const STOP_WORDS = new Set([
    'the','is','in','at','which','on','and','a','an','to','of','for','with','by',
    'as','that','this','it','from','be','or','are','was','were','has','have','had'
    ])

    /* ---------------- TEXT CLEANING ---------------- */

    /**
     * Clean text while preserving paragraph structure
     */
    export const cleanText = (text) => {
    return text
        .replace(/\r\n/g, '\n')         // normalize newlines
        .replace(/\n{3,}/g, '\n\n')     // collapse excessive newlines
        .replace(/[ \t]+/g, ' ')        // remove extra spaces
        .trim()
    }

    /* ---------------- PARAGRAPH SPLITTING ---------------- */

    const splitParagraphs = (text) => {
    // split by single or double newline
    return text.split(/\n{1,2}/).map(p => p.trim()).filter(Boolean)
    }

    /* ---------------- WORD SPLIT ---------------- */

    const splitByWords = (paragraph, size) => {
    const words = paragraph.split(/\s+/)
    const chunks = []

    for (let i = 0; i < words.length; i += size) {
        chunks.push(words.slice(i, i + size).join(' '))
    }

    return chunks
    }

    /* ---------------- MAIN CHUNKER ---------------- */

    /**
     * Splits large text into chunks while preserving paragraphs.
     *
     * @param {string} text
     * @param {number} chunkSize - target words per chunk
     * @param {number} overlap - overlap words
     * @returns {Array<{content:string, chunkIndex:number, pageNumber:number}>}
     */
    export const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || text.trim().length === 0) return []

    const clean = cleanText(text)
    const paragraphs = splitParagraphs(clean)

    const chunks = []
    let currentChunk = []
    let currentLength = 0
    let chunkIndex = 0

    const addChunk = () => {
        if (currentChunk.length === 0) return

        const content = currentChunk.join('\n\n').trim()

        chunks.push({
        content,
        chunkIndex,
        pageNumber: 1, // placeholder if using PDFs
        })

        chunkIndex++

        // create overlap
        if (overlap > 0) {
        const words = content.split(/\s+/)
        currentChunk = [words.slice(-overlap).join(' ')]
        currentLength = overlap
        } else {
        currentChunk = []
        currentLength = 0
        }
    }

    for (const para of paragraphs) {
        const wordCount = para.split(/\s+/).length

        // If paragraph itself exceeds chunk size → split by words
        if (wordCount > chunkSize) {
        const splitParas = splitByWords(para, chunkSize)

        for (const part of splitParas) {
            addChunk()
            currentChunk = [part]
            currentLength = part.split(/\s+/).length
        }
        continue
        }

        // If adding paragraph exceeds chunk size → save current chunk
        if (currentLength + wordCount > chunkSize) {
        addChunk()
        }

        // Add paragraph to current chunk
        currentChunk.push(para)
        currentLength += wordCount
    }

    // add last chunk
    addChunk()

    // fallback: if no chunks created → split by words
    if (chunks.length === 0) {
        return splitByWords(clean, chunkSize).map((content, i) => ({
        content,
        chunkIndex: i,
        pageNumber: 1,
        }))
    }

    return chunks
    }

    /* ---------------- QUERY PROCESSING ---------------- */

    /**
     * Extract & clean query words
     */
    export const extractQueryWords = (query) => {
    return query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word && !STOP_WORDS.has(word))
    }

    /* ---------------- CHUNK RETRIEVAL ---------------- */

    /**
     * Find relevant chunks based on keyword matching
     */
    export const findRelevantChunks = (chunks, query, limit = 5) => {
    const queryWords = extractQueryWords(query)
    if (!queryWords.length) return []

    const results = chunks.map(chunk => {
        const contentLower = chunk.content.toLowerCase()
        const words = contentLower.split(/\s+/)

        let score = 0
        let matches = 0

        queryWords.forEach(q => {
        // exact match → higher score
        const exactMatches = words.filter(w => w === q).length
        if (exactMatches > 0) {
            score += exactMatches * 3
            matches++
        }

        // partial match → lower score
        const partialMatches = words.filter(w => w.includes(q)).length
        if (partialMatches > 0) {
            score += partialMatches
            matches++
        }
        })

        // bonus: multiple query words found
        if (matches > 1) score += matches * 2

        // normalize by content length
        score = score / Math.sqrt(words.length)

        // small bonus for earlier chunks
        score += Math.max(0, 1 - chunk.chunkIndex * 0.05)

        return { ...chunk, score }
    })

    return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ content, chunkIndex, pageNumber }) => ({
        content,
        chunkIndex,
        pageNumber,
        }))
    }
