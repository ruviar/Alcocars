import { NextResponse } from 'next/server';
import { getAllOffices } from '../../../server/modules/offices/offices.service';
import { withErrorLogging } from '../../../server/http';

export const GET = withErrorLogging(async () => NextResponse.json(await getAllOffices()));
