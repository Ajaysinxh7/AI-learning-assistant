import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js"
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";
//import chatHistory from "../models/ChatHistory.js";

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
        const { documentId, numQuestions = 5,title } =req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'please provide documentId',
                statusCode:400
            });
        }

        const document= await Document.findOne({
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
            // Generate quiz using Gemini
            const questions = await geminiService.generateQuiz(
                document.extractedText,
                parseInt(numQuestions)
            );

            // Save to database
            const quiz=await Quiz.create({
                userId:req.user._id,
                documentId:document._id,
                title: title || `${document.title} - Quiz`,
                questions:questions,
                totalQuestions:questions.length,
                userAnswers: [],
                score:0
            });

            res.status(201).json({
                success:true,
                data:quiz,
                message:'Quiz generated successfully'
            });
        
    }catch(error){
        next(error);
    }
};

// @desc Generate document summary
// @route POST /api/ai/generate-summary
// @access PRIVATE
export const generateSummary=async(req,res,next)=>{
    try{
        const { documentId } =req.body;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'please provide documentId',
                statusCode:400
            });
        }

        const document= await Document.findOne({
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
        
        // Generate Summary using Gemini
        const summary = await geminiService.generateSummary(document.extractedText);

        res.status(200).json({
                success:true,
                data:{
                    documentId:documentId,
                    title:document.title,
                    summary
                },
                message:'Summary generated successfully'
            });
    }catch(error){
        next(error);
    }
};

// @desc Generate chat with document
// @route POST /api/ai/chat
// @access PRIVATE
export const chat=async(req,res,next)=>{
    try{
        const { documentId, question } =req.body;

        if(!documentId || !question){
            return res.status(400).json({
                success:false,
                error:'please provide documentId and question',
                statusCode:400
            });
        }

        const document= await Document.findOne({
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

        // find relevant chunks
        const relevantChunks = findRelevantChunks(document.chunks,question,3);
        const chunkIndices=relevantChunks.map(c => c.chunkIndex);

        // Get or create chat history
        let chatHistory= await ChatHistory.findOne({
            documentId:documentId,
            userId:req.user._id,                
        });

        if(!chatHistory){
            chatHistory= await ChatHistory.create({
            documentId:documentId,
            userId:req.user._id,
            messages: []
        });
        }
        
        // Generate response using Gemini
        const answer = await geminiService.chatWithContext(question,relevantChunks);

        // Save conversation 
        chatHistory.messages.push(
            {
                role: 'user',
                content: question,
                timestamp: new Date(),
                relevantChunks: []
            },
            {
                role: 'assistant',
                content: answer,
                timestamp: new Date(),
                relevantChunks: chunkIndices
            }
        );

        await chatHistory.save();

        res.status(200).json({
            success:true,
            data:{
                question,
                answer,
                relevantChunks:chunkIndices,
                chatHistoryId:chatHistory._id
            },
            message:'Response generated successfully'
        });
    }catch(error){
        next(error);
    }
};

// @desc Explain concept from document
// @route POST /api/ai/explain-concept
// @access PRIVATE
export const explainConcept=async(req,res,next)=>{
    try{
        const { documentId , concept }=req.body;

        if(!documentId || !concept){
            return res.status(400).json({
                success:false,
                error:'please provide documentId and concept',
                statusCode:400
            });
        }

        const document= await Document.findOne({
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

        const relevantChunks = findRelevantChunks(document.chunks,concept,3);
        const context=relevantChunks.map(c => c.content).join('\n\n');

        // Generate explanation using Gemini
        const explanation = await geminiService.explainConcept(concept,context);
        
        res.status(200).json({
            success:true,
            data:{
                concept,
                explanation,
                relevantChunks:relevantChunks.map(c => c.chunkIndex),
            },
            message:'Explanation generated successfully'
        });
    }catch(error){
        next(error);
    }
};

// @desc Get chat history from document
// @route GET /api/ai/chat-history/:documentId
// @access PRIVATE
export const getChatHistory=async(req,res,next)=>{
    try{
        const { documentId } = req.params;

        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'please provide documentId',
                statusCode:400
            });
        }

        const chatHistory = await ChatHistory.findOne({
            documentId: documentId,
            userId: req.user._id,
});

        if (!chatHistory) {
            return res.status(200).json({
            success: true,
            data: [],
            message: 'No chat history found'
        });
}

    res.status(200).json({
    success: true,
    data: chatHistory.messages,
    });
        }catch(error){
            next(error);
        }
    };