import React from 'react';
import ApprovalTable from '../../components/admin/ApprovalTable';

/**
 * StoreApprovalsPage — admin store registration review
 */
export default function StoreApprovalsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-gradient-admin">Store Approvals</h1>
        <p className="text-slate-400 text-sm mt-1">Review, approve, or reject store registration applications.</p>
      </div>
      <ApprovalTable />
    </div>
  );
}
