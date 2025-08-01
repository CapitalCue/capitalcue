#!/usr/bin/env python3
"""
Document Parser MCP Server
Handles extraction of financial data from PDF, Excel, and CSV documents
"""

import os
import re
import json
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import PyPDF2
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Parser MCP Server",
    description="Financial document parsing and data extraction service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class FinancialMetric(BaseModel):
    name: str
    value: float
    unit: str
    period: str
    source: str
    confidence: float

class ParseRequest(BaseModel):
    document_id: str
    file_path: str
    file_type: str

class ParseResponse(BaseModel):
    document_id: str
    extracted_text: str
    tables: List[Dict[str, Any]]
    metrics: List[FinancialMetric]
    confidence: float
    success: bool
    error: Optional[str] = None

class DocumentParser:
    """Main document parsing class"""
    
    def __init__(self):
        self.financial_patterns = self._load_financial_patterns()
        
    def _load_financial_patterns(self) -> Dict[str, str]:
        """Load regex patterns for financial metric extraction"""
        return {
            'revenue': r'(?:revenue|sales|net sales|total revenue)[\s:$]*([0-9,]+\.?[0-9]*)\s*(?:million|billion|thousand|M|B|K)?',
            'net_income': r'(?:net income|net profit|net earnings)[\s:$]*([0-9,]+\.?[0-9]*)\s*(?:million|billion|thousand|M|B|K)?',
            'eps': r'(?:earnings per share|eps)[\s:$]*([0-9,]+\.?[0-9]*)',
            'pe_ratio': r'(?:p/e ratio|pe ratio|price.earnings)[\s:]*([0-9,]+\.?[0-9]*)',
            'pb_ratio': r'(?:p/b ratio|pb ratio|price.book)[\s:]*([0-9,]+\.?[0-9]*)',
            'debt_to_equity': r'(?:debt.to.equity|debt/equity|d/e)[\s:]*([0-9,]+\.?[0-9]*)',
            'current_ratio': r'(?:current ratio)[\s:]*([0-9,]+\.?[0-9]*)',
            'gross_margin': r'(?:gross margin|gross profit margin)[\s:]*([0-9,]+\.?[0-9]*)%?',
            'operating_margin': r'(?:operating margin|operating profit margin)[\s:]*([0-9,]+\.?[0-9]*)%?',
            'net_margin': r'(?:net margin|net profit margin)[\s:]*([0-9,]+\.?[0-9]*)%?',
            'roe': r'(?:return on equity|roe)[\s:]*([0-9,]+\.?[0-9]*)%?',
            'roa': r'(?:return on assets|roa)[\s:]*([0-9,]+\.?[0-9]*)%?',
            'cash_flow': r'(?:cash flow|operating cash flow)[\s:$]*([0-9,]+\.?[0-9]*)\s*(?:million|billion|thousand|M|B|K)?',
            'market_cap': r'(?:market cap|market capitalization)[\s:$]*([0-9,]+\.?[0-9]*)\s*(?:million|billion|thousand|M|B|K)?',
        }
    
    async def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract text and data from PDF files"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                # Extract tables (basic implementation)
                tables = self._extract_tables_from_text(text)
                
                # Extract financial metrics
                metrics = self._extract_financial_metrics(text)
                
                return {
                    'extracted_text': text,
                    'tables': tables,
                    'metrics': metrics,
                    'confidence': 0.8  # Base confidence for PDF extraction
                }
                
        except Exception as e:
            logger.error(f"Error parsing PDF: {str(e)}")
            raise HTTPException(status_code=500, f"PDF parsing failed: {str(e)}")
    
    async def parse_excel(self, file_path: str) -> Dict[str, Any]:
        """Extract data from Excel files"""
        try:
            # Read all sheets
            excel_data = pd.read_excel(file_path, sheet_name=None)
            
            text = ""
            tables = []
            all_metrics = []
            
            for sheet_name, df in excel_data.items():
                # Convert DataFrame to text for pattern matching
                sheet_text = df.to_string()
                text += f"Sheet: {sheet_name}\n{sheet_text}\n\n"
                
                # Store table data
                tables.append({
                    'sheet_name': sheet_name,
                    'data': df.to_dict('records'),
                    'columns': df.columns.tolist()
                })
                
                # Extract metrics from this sheet
                sheet_metrics = self._extract_financial_metrics(sheet_text)
                all_metrics.extend(sheet_metrics)
            
            return {
                'extracted_text': text,
                'tables': tables,
                'metrics': all_metrics,
                'confidence': 0.9  # Higher confidence for structured data
            }
            
        except Exception as e:
            logger.error(f"Error parsing Excel: {str(e)}")
            raise HTTPException(status_code=500, f"Excel parsing failed: {str(e)}")
    
    async def parse_csv(self, file_path: str) -> Dict[str, Any]:
        """Extract data from CSV files"""
        try:
            df = pd.read_csv(file_path)
            
            # Convert to text for pattern matching
            text = df.to_string()
            
            # Store table data
            tables = [{
                'sheet_name': 'csv_data',
                'data': df.to_dict('records'),
                'columns': df.columns.tolist()
            }]
            
            # Extract financial metrics
            metrics = self._extract_financial_metrics(text)
            
            return {
                'extracted_text': text,
                'tables': tables,
                'metrics': metrics,
                'confidence': 0.9  # High confidence for structured data
            }
            
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise HTTPException(status_code=500, f"CSV parsing failed: {str(e)}")
    
    def _extract_tables_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract table-like structures from text (basic implementation)"""
        tables = []
        
        # Look for table patterns (simplified)
        lines = text.split('\n')
        current_table = []
        
        for line in lines:
            # Check if line looks like a table row (contains multiple numbers/values)
            if re.search(r'\s+\d+.*\d+.*\d+', line):
                current_table.append(line.strip())
            elif current_table:
                # End of table, save it
                if len(current_table) > 2:  # At least header + 2 rows
                    tables.append({
                        'type': 'extracted_table',
                        'rows': current_table,
                        'confidence': 0.6
                    })
                current_table = []
        
        return tables
    
    def _extract_financial_metrics(self, text: str) -> List[FinancialMetric]:
        """Extract financial metrics using regex patterns"""
        metrics = []
        text_lower = text.lower()
        
        for metric_name, pattern in self.financial_patterns.items():
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            
            for match in matches:
                try:
                    value_str = match.group(1).replace(',', '')
                    value = float(value_str)
                    
                    # Determine unit based on context
                    unit = self._determine_unit(match.group(0))
                    
                    metric = FinancialMetric(
                        name=metric_name,
                        value=value,
                        unit=unit,
                        period='current',  # Would need more sophisticated period detection
                        source='document_extraction',
                        confidence=0.7
                    )
                    metrics.append(metric)
                    
                except (ValueError, IndexError):
                    continue
        
        return metrics
    
    def _determine_unit(self, context: str) -> str:
        """Determine the unit of measurement from context"""
        context_lower = context.lower()
        
        if 'billion' in context_lower or ' b' in context_lower:
            return 'billions'
        elif 'million' in context_lower or ' m' in context_lower:
            return 'millions'
        elif 'thousand' in context_lower or ' k' in context_lower:
            return 'thousands'
        elif '%' in context_lower or 'percent' in context_lower:
            return 'percentage'
        elif 'ratio' in context_lower:
            return 'ratio'
        else:
            return 'units'

# Initialize parser
parser = DocumentParser()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-parser-mcp"}

@app.post("/parse", response_model=ParseResponse)
async def parse_document(request: ParseRequest):
    """Parse a financial document and extract data"""
    try:
        logger.info(f"Parsing document: {request.document_id}")
        
        # Check if file exists
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Parse based on file type
        if request.file_type.lower() == 'pdf':
            result = await parser.parse_pdf(request.file_path)
        elif request.file_type.lower() in ['excel', 'xlsx', 'xls']:
            result = await parser.parse_excel(request.file_path)
        elif request.file_type.lower() == 'csv':
            result = await parser.parse_csv(request.file_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {request.file_type}")
        
        return ParseResponse(
            document_id=request.document_id,
            extracted_text=result['extracted_text'],
            tables=result['tables'],
            metrics=result['metrics'],
            confidence=result['confidence'],
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing document {request.document_id}: {str(e)}")
        return ParseResponse(
            document_id=request.document_id,
            extracted_text="",
            tables=[],
            metrics=[],
            confidence=0.0,
            success=False,
            error=str(e)
        )

@app.post("/upload-and-parse")
async def upload_and_parse(file: UploadFile = File(...)):
    """Upload and immediately parse a document"""
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Determine file type
        file_extension = Path(file.filename).suffix.lower()
        file_type_map = {
            '.pdf': 'pdf',
            '.xlsx': 'excel',
            '.xls': 'excel',
            '.csv': 'csv'
        }
        
        file_type = file_type_map.get(file_extension, 'unknown')
        
        if file_type == 'unknown':
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
        
        # Parse the document
        request = ParseRequest(
            document_id=f"upload_{file.filename}",
            file_path=temp_path,
            file_type=file_type
        )
        
        result = await parse_document(request)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in upload and parse: {str(e)}")
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("NODE_ENV") == "development" else False
    )