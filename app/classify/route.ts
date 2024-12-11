import { NextResponse } from 'next/server'
// @ts-ignore
import PipelineSingleton from '@/lib/ml/pipeline';

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
	const classifier = await PipelineSingleton.getInstance();

	// Actually perform the classification
	const result = await classifier(text);

	return NextResponse.json(result);
}
