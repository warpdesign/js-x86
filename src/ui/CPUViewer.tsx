import React from 'react';
import { CPU_DUMP } from '../cpu/X86';

export const CPUViewer = ({ _, cpu }: { _: number; cpu: CPU_DUMP }) => {
    return (
        <pre>
            {`AX: ${cpu.ax}   SI=${cpu.si}   DS=${cpu.ds}   ES=${cpu.es}   SS=${cpu.ss}\n\
         BX: ${cpu.bx}   DI=${cpu.di}   CS=${cpu.cs}   IP=${cpu.ip}\n\
         CX: ${cpu.cx}   BP=${cpu.bp}   C    Z    S    O    A    P    D    I    T\n\
         DX: ${cpu.dx}   SP=${cpu.sp}   ${cpu.cf}    ${cpu.zf}    ${cpu.sf}    ${cpu.of}    ${cpu.af}    ${cpu.pf}    ${cpu.df}    ${cpu.if}    ${cpu.tf}`}
        </pre>
    );
};
