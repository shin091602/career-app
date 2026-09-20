import { AppShell } from '../components';
import { TaskRunner } from '../engine/task';
import { adTaskSet } from '../../content/task-ad/tasks';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('task-ad');

/** 課題（広告代理店社員）の入口。コンテンツが入るまでは準備中を出す */
export function TaskAdPage() {
  if (!adTaskSet) return <PreparingNotice prototype={prototype} />;

  return (
    <AppShell title={adTaskSet.title} subtitle={adTaskSet.jobTitle} showBack>
      <TaskRunner taskSet={adTaskSet} prototypeId={prototype.id} />
    </AppShell>
  );
}
