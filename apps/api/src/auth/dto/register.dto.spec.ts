import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

/** Runs the same steps as the global ValidationPipe: transform, then validate. */
async function check(body: Record<string, unknown>) {
  const dto = plainToInstance(RegisterDto, body);
  const errors = await validate(dto);
  return { dto, failedFields: errors.map((error) => error.property) };
}

const valid = {
  email: 'axel@example.test',
  displayName: 'Axel',
  password: 'super-secret',
};

describe('RegisterDto', () => {
  it('accepts a valid body', async () => {
    const { failedFields } = await check(valid);
    expect(failedFields).toEqual([]);
  });

  it('normalises the email: trimmed and lowercase', async () => {
    const { dto } = await check({ ...valid, email: '  Axel@Example.TEST ' });
    expect(dto.email).toBe('axel@example.test');
  });

  describe('displayName', () => {
    it.each(['Élodie', 'Zoé_42', 'jean-luc', 'A'])(
      'accepts %p',
      async (displayName) => {
        const { failedFields } = await check({ ...valid, displayName });
        expect(failedFields).toEqual([]);
      },
    );

    it.each(['a b', 'a@b', '#tag', '', '   ', 'x'.repeat(21)])(
      'rejects %p',
      async (displayName) => {
        const { failedFields } = await check({ ...valid, displayName });
        expect(failedFields).toContain('displayName');
      },
    );

    it('trims surrounding spaces', async () => {
      const { dto, failedFields } = await check({
        ...valid,
        displayName: '  Axel  ',
      });
      expect(failedFields).toEqual([]);
      expect(dto.displayName).toBe('Axel');
    });

    it('recomposes an accent typed as two code points (NFC): it passes and counts as one letter', async () => {
      const decomposed = 'E\u0301lodie'; // "E" + combining acute accent
      const { dto, failedFields } = await check({
        ...valid,
        displayName: decomposed,
      });
      expect(failedFields).toEqual([]);
      expect(dto.displayName).toBe('\u00c9lodie'); // one precomposed "É"
      expect(dto.displayName).toHaveLength(6);
    });
  });

  it.each(['short', 'x'.repeat(129)])(
    'rejects the password %p (8 to 128 characters)',
    async (password) => {
      const { failedFields } = await check({ ...valid, password });
      expect(failedFields).toContain('password');
    },
  );
});
