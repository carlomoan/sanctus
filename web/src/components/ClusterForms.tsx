import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Cluster, Scc, Parish } from '../types';

const ic = "mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2";

export function CForm({i,p,onD,onX}:{i?:Cluster;p:Parish[];onD:(d:any)=>Promise<void>;onX:()=>void}){
  const {register,handleSubmit,formState:{isSubmitting},reset}=useForm();
  useEffect(()=>{if(i)reset(i);},[i,reset]);
  return <form onSubmit={handleSubmit(onD)} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Name</label><input {...register('cluster_name',{required:true})} className={ic}/></div>
      <div><label className="text-sm font-medium text-gray-700">Code</label><input {...register('cluster_code',{required:true})} disabled={!!i} className={ic}/></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Parish</label>
        <select {...register('parish_id',{required:true})} disabled={!!i} className={ic}>
          <option value="">Select</option>{p.map(x=><option key={x.id} value={x.id}>{x.parish_name}</option>)}
        </select></div>
      <div><label className="text-sm font-medium text-gray-700">Leader</label><input {...register('leader_name')} className={ic}/></div>
    </div>
    <div><label className="text-sm font-medium text-gray-700">Location</label><input {...register('location_description')} className={ic}/></div>
    <div className="flex justify-end gap-3 pt-4 border-t">
      <button type="button" onClick={onX} className="px-4 py-2 border rounded-md text-sm text-gray-700">Cancel</button>
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 disabled:opacity-50">{isSubmitting?'Saving...':(i?'Update':'Create')}</button>
    </div>
  </form>;
}

export function SForm({i,p,c,onD,onX}:{i?:Scc;p:Parish[];c:Cluster[];onD:(d:any)=>Promise<void>;onX:()=>void}){
  const {register,handleSubmit,formState:{isSubmitting},reset}=useForm();
  useEffect(()=>{if(i)reset(i);},[i,reset]);
  return <form onSubmit={handleSubmit(onD)} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Name</label><input {...register('scc_name',{required:true})} className={ic}/></div>
      <div><label className="text-sm font-medium text-gray-700">Code</label><input {...register('scc_code',{required:true})} disabled={!!i} className={ic}/></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Parish</label>
        <select {...register('parish_id',{required:true})} disabled={!!i} className={ic}>
          <option value="">Select</option>{p.map(x=><option key={x.id} value={x.id}>{x.parish_name}</option>)}
        </select></div>
      <div><label className="text-sm font-medium text-gray-700">Cluster</label>
        <select {...register('cluster_id')} className={ic}>
          <option value="">--</option>{c.map(x=><option key={x.id} value={x.id}>{x.cluster_name}</option>)}
        </select></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Patron Saint</label><input {...register('patron_saint')} className={ic}/></div>
      <div><label className="text-sm font-medium text-gray-700">Leader</label><input {...register('leader_name')} className={ic}/></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-sm font-medium text-gray-700">Meeting Day</label><input {...register('meeting_day')} className={ic}/></div>
      <div><label className="text-sm font-medium text-gray-700">Meeting Time</label><input {...register('meeting_time')} className={ic}/></div>
    </div>
    <div className="flex justify-end gap-3 pt-4 border-t">
      <button type="button" onClick={onX} className="px-4 py-2 border rounded-md text-sm text-gray-700">Cancel</button>
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 disabled:opacity-50">{isSubmitting?'Saving...':(i?'Update':'Create')}</button>
    </div>
  </form>;
}
