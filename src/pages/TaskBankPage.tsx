import { AppShell } from '../components';
import { TaskRunner } from '../engine/task';
import { bankTaskSet } from '../../content/task-bank/tasks';
import { getPrototype } from '../prototypes';

const prototype = getPrototype('task-bank');

/** 課題（銀行員）の入口。課題データを渡すだけの薄いページ */
export function TaskBankPage() {
  return (
    <AppShell title={bankTaskSet.title} subtitle={bankTaskSet.jobTitle} showBack>
      <TaskRunner taskSet={bankTaskSet} prototypeId={prototype.id} />
    </AppShell>
  );
}
