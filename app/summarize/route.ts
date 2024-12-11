import { NextResponse } from 'next/server'
// @ts-ignore
import SummarizationPipelineSingleton from '@/lib/ml/summarizer'

// @ts-ignore
export async function GET(request) {
	const text = request.nextUrl.searchParams.get('text');
	if (!text) {
		return NextResponse.json({
			error: 'Missing text parameter',
		}, { status: 400 });
	}
	// Get the classification pipeline. When called for the first time,
	// this will load the pipeline and cache it for future use.
	// @ts-ignore
	const summarizer = await SummarizationPipelineSingleton.getInstance();

	// Actually perform the classification
	const result = await summarizer(text);

	return NextResponse.json(result);
}
