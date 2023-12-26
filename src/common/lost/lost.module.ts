import { Module } from '@nestjs/common';
import { LostController } from './lost.controller';
import { LostService } from './lost.service';
import { SupabaseModule } from 'src/providers/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [LostController],
  providers: [LostService],
})
export class LostModule {}
