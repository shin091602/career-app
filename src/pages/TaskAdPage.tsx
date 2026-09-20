import { AppShell } from '../components';
import { TaskRunner } from '../engine/task';
import { taskSet } from '../../content/task-ad/tasks';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('task-ad');

/** 課題（広告代理店社員）の入口。課題が入るまでは準備中を出す */
export function TaskAdPage() {
  if (!taskSet) return <PreparingNotice prototype={prototype} />;

  return (
    <AppShell title={taskSet.title} subtitle={taskSet.jobTitle} showBack>
      <TaskRunner taskSet={taskSet} prototypeId={prototype.id} />
    </AppShell>
  );
}
