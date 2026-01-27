import { NextResponse } from 'next/server';
import { TradeData, RawQuoteData } from '@/types';
import fs from 'fs';
import path from 'path';
import { transformRawData, parseCSV } from '@/lib/transform';

// For now, we'll read from a JSON or CSV file
// Later, you can replace this with a database query
export async function GET() {
  try {
    // Try CSV first (raw data format)
    const csvPath = path.join(process.cwd(), 'data', 'quotes.csv');
    if (fs.existsSync(csvPath)) {
      try {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const rawData = parseCSV(csvContent);
        if (rawData.length === 0) {
          console.warn('CSV parsed but no data found');
        }
        const transformedData = transformRawData(rawData);
        console.log(`Loaded ${transformedData.length} trades from CSV`);
        return NextResponse.json(transformedData);
      } catch (csvError) {
        console.error('Error processing CSV:', csvError);
        throw csvError;
      }
    }
    
    // Try JSON with raw data format
    const rawJsonPath = path.join(process.cwd(), 'data', 'quotes.json');
    if (fs.existsSync(rawJsonPath)) {
      try {
        const fileContents = fs.readFileSync(rawJsonPath, 'utf8');
        const rawData: RawQuoteData[] = JSON.parse(fileContents);
        const transformedData = transformRawData(rawData);
        console.log(`Loaded ${transformedData.length} trades from JSON`);
        return NextResponse.json(transformedData);
      } catch (jsonError) {
        console.error('Error processing JSON:', jsonError);
        throw jsonError;
      }
    }
    
    // Fallback to old trades.json format (already transformed)
    const tradesPath = path.join(process.cwd(), 'data', 'trades.json');
    if (fs.existsSync(tradesPath)) {
      try {
        const fileContents = fs.readFileSync(tradesPath, 'utf8');
        const data: TradeData[] = JSON.parse(fileContents);
        console.log(`Loaded ${data.length} trades from legacy format`);
        return NextResponse.json(data);
      } catch (legacyError) {
        console.error('Error processing legacy format:', legacyError);
        throw legacyError;
      }
    }
    
    // Return empty array if no data file exists
    console.warn('No data files found');
    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Error reading data:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Failed to load data',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
