import Document from "../models/Document";
import Flashcard from "../models/Flashcard";
import Quiz from "../models/Quiz";
import ChatHistory from "../models/ChatHistory.js"
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

