import { AppShell } from '../components';
import { TaskRunner } from '../engine/task';
import { taskSet } from '../../content/task-bank/tasks';
import { getPrototype } from '../prototypes';
import { PreparingNotice } from './PreparingNotice';

const prototype = getPrototype('task-bank');

/** 課題（銀行員）の入口。課題が入るまでは準備中を出す */
export function TaskBankPage() {
  if (!taskSet) return <PreparingNotice prototype={prototype} />;

  return (
    <AppShell title={taskSet.title} subtitle={taskSet.jobTitle} showBack>
      <TaskRunner taskSet={taskSet} prototypeId={prototype.id} />
    </AppShell>
  );
}
