import 'dotenv/config';
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

const socket = DjsConnect();

while ( true ) {
    try {
        const start = Date.now();
        
        await socket.emitMove('right');
        await socket.emitMove('down');
        await socket.emitMove('left');
        await socket.emitMove('up');
        
        console.log('moving in circle took on avg', (Date.now() - start) / 4, 'ms per move');

    } catch (e) {
        console.error('error while moving in circle', e instanceof Error ? e.message : e);
    }
}
