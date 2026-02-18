import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js"
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

// @desc Generate flashcards from document
// @route POST /api/ai/generate-flashcards
// @access PRIVATE
export const generateFlashcards=async(req,res,next)=>{
    try{
        const { documentId, count=10 } = req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Please provide documentId',
                statusCode:400
            });
        }
        const document=await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:'ready'
        });

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            });
        }

        // Generate Flashcard using gemini
        const cards=await geminiService.generateFlashcards(
            document.extractedText,
            parseInt(count)
        );

        // Save to database
        const flashcardSet= await Flashcard.create({
            userId:req.user._id,
            documentId:document._id,
            cards:cards.map(card =>({
                question:card.question,
                answer:card.answer,
                difficulty:card.difficulty,
                reviewCount:0,
                isStarred:false
            }))
        });

        res.status(201).json({
            success:true,
            data:flashcardSet,
            message:'Flashcards generated successfully'
        });
    }catch(error){
        next(error);
    }
};

// @desc Generate quiz from document
// @route POST /api/ai/generate-quiz
// @access PRIVATE
export const generateQuiz=async(req,res,next)=>{
    try{

    }catch(error){
        next(error);
    }
};

// @desc Generate document summary
// @route POST /api/ai/generate-summary
// @access PRIVATE
export const generateSummary=async(req,res,next)=>{
    try{

    }catch(error){
        next(error);
    }
};

// @desc Generate chat with document
// @route POST /api/ai/chat
// @access PRIVATE
export const chat=async(req,res,next)=>{
    try{

    }catch(error){
        next(error);
    }
};

// @desc Explain concept from document
// @route POST /api/ai/explain-concept
// @access PRIVATE
export const explainConcept=async(req,res,next)=>{
    try{

    }catch(error){
        next(error);
    }
};

// @desc Get chat history from document
// @route GET /api/ai/chat-history/:documentId
// @access PRIVATE
export const getChatHistory=async(req,res,next)=>{
    try{

    }catch(error){
        next(error);
    }
};